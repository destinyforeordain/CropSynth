-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types from Appendix A
CREATE TYPE activity_type AS ENUM ('sowing', 'irrigation', 'spraying', 'harvesting', 'weeding', 'fertilizing');
CREATE TYPE expense_category AS ENUM ('seeds', 'fertilizers', 'pesticides', 'labor', 'equipment', 'other');
CREATE TYPE scheme_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');

-- Tables from Section 3.3
-- Users table (managed by Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR,
  full_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm profiles
CREATE TABLE farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farm_name VARCHAR NOT NULL,
  location JSONB, -- {district, village, coordinates}
  land_size_acres DECIMAL,
  soil_type VARCHAR,
  irrigation_type VARCHAR,
  primary_crops TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities log
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR NOT NULL, -- sowing, irrigation, spraying, harvesting
  description TEXT,
  crop_name VARCHAR,
  date DATE NOT NULL,
  voice_note_url VARCHAR,
  images TEXT[],
  metadata JSONB, -- additional structured data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses tracking
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR NOT NULL, -- seeds, fertilizers, pesticides, labor, equipment
  item_name VARCHAR NOT NULL,
  quantity DECIMAL,
  unit VARCHAR,
  cost DECIMAL NOT NULL,
  date DATE NOT NULL,
  receipt_url VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales/Revenue tracking
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  crop_name VARCHAR NOT NULL,
  quantity DECIMAL NOT NULL,
  unit VARCHAR,
  price_per_unit DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  buyer_info JSONB,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crop health records
CREATE TABLE crop_health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  crop_name VARCHAR NOT NULL,
  image_urls TEXT[],
  ai_diagnosis JSONB, -- disease detection results
  symptoms TEXT,
  treatment_applied TEXT,
  status VARCHAR, -- healthy, diseased, treated, recovered
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Corrected from user_Iid
  messages JSONB NOT NULL, -- array of {role, content, timestamp}
  language VARCHAR DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Government schemes
CREATE TABLE government_schemes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_name VARCHAR NOT NULL,
  description TEXT,
  eligibility_criteria JSONB,
  benefits TEXT,
  application_process TEXT,
  deadline DATE,
  status VARCHAR DEFAULT 'active',
  target_crops TEXT[],
  target_districts TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User scheme applications
CREATE TABLE scheme_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheme_id UUID REFERENCES government_schemes(id) NOT NULL,
  application_data JSONB,
  status VARCHAR DEFAULT 'draft', -- draft, submitted, approved, rejected
  applied_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance from Appendix A
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_activities_farm_id ON activities(farm_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_expenses_farm_id ON expenses(farm_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_sales_farm_id ON sales(farm_id);
CREATE INDEX idx_crop_health_farm_id ON crop_health_records(farm_id);
CREATE INDEX idx_chat_user_id ON chat_conversations(user_id);

-- Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own profile"
ON profiles FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage their own farm data"
ON farms FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own activities"
ON activities FOR ALL USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = activities.farm_id AND farms.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = activities.farm_id AND farms.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own expenses"
ON expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = expenses.farm_id AND farms.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = expenses.farm_id AND farms.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own sales"
ON sales FOR ALL USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = sales.farm_id AND farms.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = sales.farm_id AND farms.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own crop health records"
ON crop_health_records FOR ALL USING (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = crop_health_records.farm_id AND farms.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM farms WHERE farms.id = crop_health_records.farm_id AND farms.user_id = auth.uid())
);

CREATE POLICY "Users can manage their own chat conversations"
ON chat_conversations FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scheme applications"
ON scheme_applications FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
