# Crop-Synth: AI-Powered Personal Farming Assistant

## Product Requirements Document (PRD)

---

## 1. Executive Summary

### 1.1 Project Overview

Crop-Synth is an AI-powered personal farming assistant designed to serve as a "Krishi Sakhi" (farming friend) for Kerala's smallholder farmers. The platform addresses the critical gap in personalized, timely agricultural advice by providing contextual guidance, activity tracking, and market intelligence through a modern web application.

### 1.2 Vision Statement

To empower Kerala's farmers with a digital companion that understands their unique farming context, provides personalized guidance, and helps maximize productivity and profitability through data-driven insights.

### 1.3 Problem Statement

- Kerala's smallholder farmers lack access to personalized, timely agricultural advice
- Generic advisories fail to account for local conditions, crop choices, and farming practices
- Poor record-keeping limits learning and access to government scheme benefits
- Language barriers and technology adoption challenges

### 1.4 Success Metrics

- **User Adoption**: 1000+ active farmers within 6 months
- **Engagement**: Daily active users spending 15+ minutes on platform
- **Productivity**: 20% improvement in crop yield through AI recommendations
- **Financial Impact**: 15% increase in farmer profitability through expense tracking
- **Knowledge Sharing**: 500+ successful crop disease identifications per month

---

## 2. User Personas & Journey

### 2.1 Primary Persona: Ravi (Small-scale Farmer)

- **Age**: 35-50 years
- **Location**: Rural Kerala (Kottayam district)
- **Farm Size**: 0.5-2 acres
- **Crops**: Rice, vegetables (brinjal, okra), spices
- **Technology**: Smartphone user, basic digital literacy
- **Languages**: Malayalam (primary), basic Hindi/English
- **Pain Points**:
  - Lacks timely weather and pest alerts
  - Struggles with expense tracking
  - Limited knowledge of government schemes
  - No systematic record-keeping

### 2.2 User Journey Map

```
Awareness → Onboarding → Daily Usage → Advanced Features → Community Engagement
    ↓           ↓            ↓             ↓                    ↓
Discovery   Profile    Chat Bot      Crop Doctor         Knowledge Sharing
           Creation   & Weather      & Schemes           & Marketplace
```

### 2.3 Key User Stories

**As a farmer, I want to:**

- Get weather alerts in Malayalam so I can plan my daily farming activities
- Upload crop photos to identify diseases and get treatment suggestions
- Track my farming expenses and income to understand profitability
- Log daily activities using voice input in my native language
- Discover government schemes I'm eligible for
- Get personalized farming advice based on my crops and location

---

## 3. Technical Architecture

### 3.1 Technology Stack

**Frontend & Backend**:

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: Zustand/React Query for server state

**Database & Authentication**:

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase Auth
- **File Storage**: Supabase Storage for images/documents

**AI & External APIs**:

- **Conversational AI**: Groq API (Llama models)
- **Translation**: Google Translate API
- **Speech Recognition**: Web Speech API + Google Cloud Speech
- **Weather Data**: OpenWeatherMap API
- **Image Processing**: Groq Vision API for crop disease detection

### 3.2 System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │────│  Supabase DB   │────│  External APIs  │
│                 │    │                 │    │                 │
│ - React UI      │    │ - PostgreSQL    │    │ - Groq AI       │
│ - API Routes    │    │ - Auth          │    │ - Weather API   │
│ - Shadcn/UI     │    │ - Storage       │    │ - Google Trans  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   User Device   │
                    │                 │
                    │ - Web Browser   │
                    │ - Speech API    │
                    │ - Camera Access │
                    └─────────────────┘
```

### 3.3 Database Schema

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR,
  full_name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Farm profiles
CREATE TABLE farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  farm_name VARCHAR NOT NULL,
  location JSONB, -- {district, village, coordinates}
  land_size_acres DECIMAL,
  soil_type VARCHAR,
  irrigation_type VARCHAR,
  primary_crops TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities log
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms NOT NULL,
  activity_type VARCHAR NOT NULL, -- sowing, irrigation, spraying, harvesting
  description TEXT,
  crop_name VARCHAR,
  date DATE NOT NULL,
  voice_note_url VARCHAR,
  images TEXT[],
  metadata JSONB, -- additional structured data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses tracking
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms NOT NULL,
  category VARCHAR NOT NULL, -- seeds, fertilizers, pesticides, labor, equipment
  item_name VARCHAR NOT NULL,
  quantity DECIMAL,
  unit VARCHAR,
  cost DECIMAL NOT NULL,
  date DATE NOT NULL,
  receipt_url VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales/Revenue tracking
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms NOT NULL,
  crop_name VARCHAR NOT NULL,
  quantity DECIMAL NOT NULL,
  unit VARCHAR,
  price_per_unit DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  buyer_info JSONB,
  sale_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crop health records
CREATE TABLE crop_health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms NOT NULL,
  crop_name VARCHAR NOT NULL,
  image_urls TEXT[],
  ai_diagnosis JSONB, -- disease detection results
  symptoms TEXT,
  treatment_applied TEXT,
  status VARCHAR, -- healthy, diseased, treated, recovered
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  messages JSONB NOT NULL, -- array of {role, content, timestamp}
  language VARCHAR DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- User scheme applications
CREATE TABLE scheme_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  scheme_id UUID REFERENCES government_schemes NOT NULL,
  application_data JSONB,
  status VARCHAR DEFAULT 'draft', -- draft, submitted, approved, rejected
  applied_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Core Features Specification

### 4.1 Priority 1: Crop-Bot (Conversational AI)

**Description**: Multilingual AI chatbot providing personalized farming advice

**User Stories**:

- As a farmer, I want to ask farming questions in Malayalam and get relevant answers
- As a farmer, I want voice input/output for hands-free interaction
- As a farmer, I want context-aware responses based on my crops and location

**Technical Implementation**:

```typescript
// API Route: /api/chat
interface ChatRequest {
  message: string;
  language: "en" | "hi" | "ml";
  conversationId?: string;
  audioInput?: boolean;
}

interface ChatResponse {
  response: string;
  audioUrl?: string;
  suggestions: string[];
  conversationId: string;
}
```

**Features**:

- Multi-language support (English, Hindi, Malayalam)
- Voice-to-text and text-to-speech
- Context-aware responses using farm profile data
- Conversation history preservation
- Suggested follow-up questions

**Acceptance Criteria**:

- [ ] User can send text messages and receive AI responses
- [ ] Voice input works in all three languages
- [ ] Responses are contextual to user's farm profile
- [ ] Conversation history is saved and retrievable
- [ ] Audio responses play correctly

### 4.2 Priority 2: Crop Doctor (Disease Detection)

**Description**: AI-powered plant disease detection and treatment recommendations

**User Stories**:

- As a farmer, I want to upload crop photos to identify diseases
- As a farmer, I want treatment suggestions for identified diseases
- As a farmer, I want to track disease history for my crops

**Technical Implementation**:

```typescript
// API Route: /api/crop-doctor
interface DiagnosisRequest {
  farmId: string;
  cropName: string;
  images: File[];
  symptoms?: string;
}

interface DiagnosisResponse {
  diagnosis: {
    disease: string;
    confidence: number;
    description: string;
  }[];
  treatments: {
    organic: string[];
    chemical: string[];
    preventive: string[];
  };
  severity: "low" | "medium" | "high";
}
```

**Features**:

- Multiple image upload support
- AI-powered disease identification using Groq Vision
- Treatment recommendations (organic & chemical)
- Disease severity assessment
- Historical disease tracking
- Integration with expense tracker for treatment costs

**Acceptance Criteria**:

- [ ] Users can upload multiple crop images
- [ ] AI provides disease identification with confidence scores
- [ ] Treatment suggestions are categorized and actionable
- [ ] Disease records are saved with timestamps
- [ ] Users can view disease history for their crops

### 4.3 Priority 3: Weather Dashboard

**Description**: Real-time weather data with farming-specific alerts and recommendations

**User Stories**:

- As a farmer, I want current weather and 7-day forecast for my location
- As a farmer, I want weather-based farming recommendations
- As a farmer, I want alerts for adverse weather conditions

**Technical Implementation**:

```typescript
// API Route: /api/weather
interface WeatherRequest {
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface WeatherResponse {
  current: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    conditions: string;
  };
  forecast: WeatherDay[];
  alerts: WeatherAlert[];
  farmingAdvice: string[];
}
```

**Features**:

- Current weather conditions with farming-relevant metrics
- 7-day detailed forecast
- Weather-based farming recommendations
- Severe weather alerts
- Rainfall predictions for irrigation planning
- Integration with activity logging

**Acceptance Criteria**:

- [ ] Dashboard shows current weather for user location
- [ ] 7-day forecast is accurate and detailed
- [ ] Farming advice updates based on weather conditions
- [ ] Users receive alerts for severe weather
- [ ] Weather data integrates with other features

### 4.4 Priority 4: Expense & Profit Tracker

**Description**: Comprehensive financial tracking for farming operations

**User Stories**:

- As a farmer, I want to track all farming expenses by category
- As a farmer, I want to record sales and calculate profit/loss
- As a farmer, I want to see financial insights and trends

**Technical Implementation**:

```typescript
// Components for expense tracking
interface Expense {
  category: "seeds" | "fertilizers" | "pesticides" | "labor" | "equipment";
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
  date: Date;
  receiptUrl?: string;
}

interface FinancialSummary {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  expensesByCategory: Record<string, number>;
  monthlyTrends: MonthlyData[];
}
```

**Features**:

- Expense tracking by category with receipt upload
- Sales recording with buyer information
- Automated profit/loss calculations
- Visual charts and trends
- Export functionality for records
- Integration with activity logging

**UI Components**:

- Expense entry forms with camera integration
- Financial dashboard with charts
- Monthly/seasonal reports
- Profit margin indicators

**Acceptance Criteria**:

- [ ] Users can add expenses with categories and receipts
- [ ] Sales can be recorded with detailed information
- [ ] Profit/loss calculations are automatic and accurate
- [ ] Visual charts show spending patterns
- [ ] Data can be exported for external use

### 4.5 Priority 5: Activity Logging

**Description**: Voice and text-based logging of daily farming activities

**User Stories**:

- As a farmer, I want to log daily activities using voice input
- As a farmer, I want to attach photos to activity logs
- As a farmer, I want to review my farming activity history

**Technical Implementation**:

```typescript
// API Route: /api/activities
interface ActivityLog {
  farmId: string;
  activityType: "sowing" | "irrigation" | "spraying" | "harvesting" | "weeding";
  description: string;
  cropName: string;
  date: Date;
  voiceNoteUrl?: string;
  images?: string[];
  metadata?: {
    duration?: number;
    area?: number;
    materials?: string[];
  };
}
```

**Features**:

- Voice-to-text activity logging in multiple languages
- Photo attachments for visual documentation
- Activity categorization and tagging
- Calendar view of activities
- Search and filter functionality
- Integration with expense tracking

**UI Components**:

- Voice recording interface
- Activity entry forms
- Calendar grid view
- Activity timeline
- Photo gallery for each activity

**Acceptance Criteria**:

- [ ] Voice input works reliably for activity logging
- [ ] Photos can be attached to activity entries
- [ ] Activities are categorized and searchable
- [ ] Calendar view shows activity timeline
- [ ] Voice notes are stored and playable

### 4.6 Priority 6: Government Schemes Hub

**Description**: Discovery and application tracking for agricultural schemes

**User Stories**:

- As a farmer, I want to discover relevant government schemes
- As a farmer, I want to check my eligibility for schemes
- As a farmer, I want to track my scheme applications

**Technical Implementation**:

```typescript
// Scheme matching algorithm
interface SchemeEligibility {
  schemeId: string;
  schemeName: string;
  eligibilityScore: number;
  matchingCriteria: string[];
  missingRequirements: string[];
  benefits: string;
  deadline?: Date;
}

interface ApplicationTracker {
  schemeId: string;
  applicationId: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  lastUpdated: Date;
  nextSteps: string[];
}
```

**Features**:

- Curated database of Kerala agricultural schemes
- Eligibility checker based on farm profile
- Application status tracking
- Deadline reminders
- Document upload for applications
- Integration with profile data

**UI Components**:

- Scheme discovery cards with eligibility indicators
- Application wizard with step-by-step guidance
- Document upload interface
- Status tracking dashboard
- Deadline notification system

**Acceptance Criteria**:

- [ ] Schemes are categorized and easily browsable
- [ ] Eligibility checker provides accurate matching
- [ ] Application process is guided and user-friendly
- [ ] Status tracking shows real-time updates
- [ ] Deadline reminders are timely and effective

---

## 5. UI/UX Design Guidelines

### 5.1 Design System with Shadcn/UI

**Color Palette**:

```css
/* Primary Colors - Agricultural Theme */
:root {
  --primary: 142 69% 58%; /* Green #4ADE80 */
  --primary-foreground: 0 0% 98%;
  --secondary: 60 4.8% 95.9%;
  --accent: 47 96% 89%; /* Yellow accent #FEF3C7 */
  --muted: 60 4.8% 95.9%;
  --border: 214.3 31.8% 91.4%;
  --destructive: 0 62.8% 30.6%;
}
```

**Typography**:

- **Headings**: Inter font family, weights 600-700
- **Body**: Inter font family, weights 400-500
- **Monospace**: JetBrains Mono for data/numbers

**Component Library**:

```typescript
// Key Shadcn components to use
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
```

### 5.2 Responsive Design Strategy

**Mobile-First Approach**:

```typescript
// Tailwind responsive breakpoints
const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large screens
}

// Mobile-optimized layout patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards stack on mobile, side-by-side on larger screens */}
</div>
```

**Touch-Friendly Interface**:

- Minimum button size: 44px × 44px
- Adequate spacing between interactive elements
- Large text inputs for easy typing
- Voice input buttons prominently displayed

**Performance Optimization**:

- Image lazy loading with Next.js Image component
- Code splitting for feature modules
- Progressive Web App (PWA) capabilities
- Offline functionality for core features

### 5.3 Multilingual Support

**Language Switching**:

```typescript
// Language context
interface LanguageContext {
  currentLanguage: 'en' | 'hi' | 'ml';
  setLanguage: (lang: string) => void;
  translate: (key: string) => string;
}

// Translation files structure
/locales
  /en.json
  /hi.json
  /ml.json
```

**RTL Support**: Prepared for Malayalam text rendering with proper text alignment

---

## 6. API Integration Specifications

### 6.1 Groq AI Integration

**Chat Completion API**:

```typescript
// /lib/groq.ts
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function getChatCompletion(
  messages: any[],
  systemPrompt: string,
  farmContext?: FarmProfile
) {
  const contextualPrompt = `
    ${systemPrompt}

    Farm Context:
    - Location: ${farmContext?.location}
    - Crops: ${farmContext?.primaryCrops.join(", ")}
    - Farm Size: ${farmContext?.landSizeAcres} acres
    - Soil Type: ${farmContext?.soilType}
    - Irrigation: ${farmContext?.irrigationType}

    Respond in a helpful, practical manner suitable for Kerala farmers.
    Keep responses concise but informative.
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "system", content: contextualPrompt }, ...messages],
    model: "llama3-8b-8192",
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content;
}
```

**Vision API for Crop Disease Detection**:

```typescript
// /lib/crop-diagnosis.ts
export async function diagnoseCropDisease(
  imageUrls: string[],
  cropName: string,
  symptoms?: string
) {
  const systemPrompt = `
    You are an expert agricultural pathologist specializing in crop diseases in Kerala, India.
    Analyze the provided crop images and identify potential diseases, pests, or nutrient deficiencies.

    For each diagnosis, provide:
    1. Disease/problem name
    2. Confidence level (0-100)
    3. Symptoms description
    4. Treatment recommendations (both organic and chemical)
    5. Prevention measures

    Crop: ${cropName}
    Additional symptoms: ${symptoms || "None provided"}

    Respond in JSON format.
  `;

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: systemPrompt },
        ...imageUrls.map((url) => ({
          type: "image_url",
          image_url: { url },
        })),
      ],
    },
  ];

  // Implementation with Groq Vision API
}
```

### 6.2 OpenWeatherMap Integration

**Weather Data Fetching**:

```typescript
// /lib/weather.ts
interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
}

export async function getWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  const baseUrl = "https://api.openweathermap.org/data/2.5";

  // Current weather
  const currentResponse = await fetch(
    `${baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );

  // 7-day forecast
  const forecastResponse = await fetch(
    `${baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );

  // Weather alerts
  const alertsResponse = await fetch(
    `${baseUrl}/alerts?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );

  const [current, forecast, alerts] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
    alertsResponse.json(),
  ]);

  return {
    current: transformCurrentWeather(current),
    forecast: transformForecast(forecast),
    alerts: transformAlerts(alerts),
  };
}

// Farming-specific weather analysis
export function generateFarmingAdvice(
  weather: WeatherData,
  crops: string[]
): string[] {
  const advice: string[] = [];

  // Rain predictions
  if (weather.forecast[0].precipitation > 5) {
    advice.push("Heavy rain expected tomorrow. Avoid spraying pesticides.");
  }

  // Temperature warnings
  if (weather.current.temperature > 35) {
    advice.push("High temperature alert. Increase irrigation frequency.");
  }

  // Humidity considerations
  if (weather.current.humidity > 80) {
    advice.push(
      "High humidity may increase fungal disease risk. Monitor crops closely."
    );
  }

  return advice;
}
```

### 6.3 Google Translate API Integration

**Multi-language Translation**:

```typescript
// /lib/translation.ts
import { Translate } from "@google-cloud/translate/build/src/v2";

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY,
});

export async function translateText(
  text: string,
  targetLanguage: "en" | "hi" | "ml",
  sourceLanguage?: string
): Promise<string> {
  try {
    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });

    return translation;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

// Batch translation for efficiency
export async function translateBatch(
  texts: string[],
  targetLanguage: string
): Promise<string[]> {
  const [translations] = await translate.translate(texts, targetLanguage);
  return Array.isArray(translations) ? translations : [translations];
}
```

### 6.4 Speech Recognition & Synthesis

**Web Speech API Implementation**:

```typescript
// /lib/speech.ts
interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;

  constructor() {
    if (typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.synthesis = window.speechSynthesis;
    }
  }

  startListening(config: SpeechRecognitionConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not supported"));
        return;
      }

      this.recognition.lang = config.language;
      this.recognition.continuous = config.continuous;
      this.recognition.interimResults = config.interimResults;

      this.recognition.onresult = (event) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  speak(text: string, language: string = "en-US"): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.onend = () => resolve();

      this.synthesis.speak(utterance);
    });
  }
}

// Language mapping for speech recognition
const speechLanguageCodes = {
  en: "en-US",
  hi: "hi-IN",
  ml: "ml-IN",
};
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1**:

- [x] Project setup with Next.js 14 + TypeScript
- [x] Supabase configuration (database, auth, storage)
- [x] Shadcn/UI setup and base components
- [x] Authentication flow with Google OAuth
- [x] Database schema implementation

**Week 2**:

- [ ] Basic UI layout and navigation
- [ ] Farm profile creation form
- [ ] Responsive design foundation
- [ ] API route structure
- [ ] Error handling and loading states

### Phase 2: Core Features (Weeks 3-5)

**Week 3 - Weather Dashboard & Activity Logging**:

- [ ] OpenWeatherMap API integration
- [ ] Weather dashboard UI with charts
- [ ] Activity logging with voice input
- [ ] Calendar view for activities
- [ ] Photo upload functionality

**Week 4 - Crop-Bot Implementation**:

- [ ] Groq API integration for chat
- [ ] Multilingual support with Google Translate
- [ ] Speech recognition and synthesis
- [ ] Context-aware responses using farm data
- [ ] Conversation history storage

**Week 5 - Crop Doctor**:

- [ ] Image upload and processing
- [ ] Groq Vision API for disease detection
- [ ] Treatment recommendations database
- [ ] Disease history tracking
- [ ] Integration with expense tracker

### Phase 3: Advanced Features (Weeks 6-7)

**Week 6 - Financial Tracking**:

- [ ] Expense entry forms with categories
- [ ] Receipt image processing and storage
- [ ] Sales recording functionality
- [ ] Profit/loss calculations and charts
- [ ] Export functionality for reports

**Week 7 - Government Schemes**:

- [ ] Schemes database setup
- [ ] Eligibility checking algorithm
- [ ] Application tracking system
- [ ] Document upload for applications
- [ ] Deadline notification system

### Phase 8: Polish & Testing (Week 8)

- [ ] Performance optimization
- [ ] Mobile responsiveness testing
- [ ] Cross-browser compatibility
- [ ] User acceptance testing
- [ ] Bug fixes and UI refinements
- [ ] Documentation completion

---

## 8. Quality Assurance & Testing

### 8.1 Testing Strategy

**Unit Testing**:

```typescript
// Example test for weather API
describe("Weather Service", () => {
  test("should fetch current weather data", async () => {
    const weatherData = await getWeatherData(10.8505, 76.2711); // Kochi coordinates
    expect(weatherData.current).toHaveProperty("temperature");
    expect(weatherData.forecast).toHaveLength(7);
  });
});
```

**Integration Testing**:

- API endpoints with database operations
- Authentication flow
- File upload functionality
- External API integrations

**User Acceptance Testing**:

- Multilingual interface testing
- Voice input/output functionality
- Mobile device compatibility
- Internet connectivity scenarios

### 8.2 Performance Metrics

**Target Performance**:

- **Page Load Time**: < 3 seconds on 3G connection
- **Time to Interactive**: < 5 seconds
- **Core Web Vitals**: Green scores for LCP, FID, CLS
- **API Response Time**: < 500ms for local operations, < 2s for AI operations

**Monitoring**:

- Real User Monitoring (RUM) with Vercel Analytics
- Error tracking with Sentry
- Performance monitoring with Web Vitals
- API usage tracking for external services

---

## 9. Security & Privacy

### 9.1 Data Protection

**Authentication & Authorization**:

- Google OAuth for secure authentication
- Row Level Security (RLS) in Supabase
- JWT token management
- Role-based access control

**Data Encryption**:

- HTTPS for all communications
- Database encryption at rest (Supabase default)
- Secure file storage with access controls
- API key management with environment variables

**Privacy Considerations**:

- Minimal data collection (only farming-related information)
- User consent for data processing
- Data anonymization for analytics
- Right to data deletion
- Transparent privacy policy

### 9.2 Security Best Practices

**API Security**:

```typescript
// Rate limiting middleware
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

// Input validation and sanitization
import { z } from "zod";

const activitySchema = z.object({
  activityType: z.enum([
    "sowing",
    "irrigation",
    "spraying",
    "harvesting",
    "weeding",
  ]),
  description: z.string().max(500),
  cropName: z.string().min(1).max(50),
  date: z.date(),
});
```

**File Upload Security**:

- File type validation (images only for crop photos)
- File size limits (max 10MB per image)
- Virus scanning integration
- Secure file naming and storage paths

**Database Security**:

```sql
-- Row Level Security policies
CREATE POLICY "Users can only access their own farm data"
ON farms FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own activities"
ON activities FOR ALL USING (
  farm_id IN (SELECT id FROM farms WHERE user_id = auth.uid())
);
```

---

## 10. Deployment & Infrastructure

### 10.1 Hosting & Deployment

**Platform**: Vercel (recommended for Next.js)

- Automatic deployments from Git
- Edge functions for API routes
- CDN for static assets
- Environment variable management

**Database**: Supabase Cloud

- Managed PostgreSQL instance
- Automatic backups
- Real-time subscriptions
- Built-in authentication

**File Storage**: Supabase Storage

- CDN-delivered images
- Automatic image optimization
- Access control policies

### 10.2 Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GROQ_API_KEY=your-groq-api-key
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
OPENWEATHER_API_KEY=your-openweather-api-key

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
```

### 10.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 11. Monitoring & Analytics

### 11.1 Application Monitoring

**Performance Monitoring**:

```typescript
// /lib/monitoring.ts
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Custom event tracking
export function trackUserAction(action: string, properties?: object) {
  if (typeof window !== "undefined") {
    // Track with Vercel Analytics
    window.va?.track(action, properties);
  }
}

// Usage examples
trackUserAction("crop_disease_diagnosed", {
  cropType: "tomato",
  diseaseDetected: "late_blight",
  confidence: 0.85,
});

trackUserAction("voice_message_sent", {
  language: "malayalam",
  duration: 15,
});
```

**Error Tracking**:

```typescript
// Error boundary for React components
import * as Sentry from "@sentry/nextjs";

export function reportError(error: Error, context?: object) {
  Sentry.captureException(error, {
    tags: context,
  });
}
```

### 11.2 Business Analytics

**Key Metrics Dashboard**:

- Daily/Monthly Active Users (DAU/MAU)
- Feature adoption rates
- Chat interactions per user
- Disease detection accuracy
- Weather alert effectiveness
- Scheme application completion rates

**User Behavior Tracking**:

```typescript
// Custom hooks for analytics
export function useAnalytics() {
  const trackFeatureUsage = (feature: string) => {
    trackUserAction("feature_used", { feature });
  };

  const trackScreenTime = (screen: string, duration: number) => {
    trackUserAction("screen_time", { screen, duration });
  };

  return { trackFeatureUsage, trackScreenTime };
}
```

---

## 12. Maintenance & Support

### 12.1 Content Management

**Government Schemes Database**:

- Quarterly updates of scheme information
- Deadline tracking and notifications
- Eligibility criteria updates
- New scheme additions

**AI Model Updates**:

- Regular retraining of disease detection models
- Crop advisory knowledge base updates
- Seasonal farming practice adjustments
- Local pest and disease pattern updates

### 12.2 User Support System

**Help Documentation**:

- Multilingual user guides
- Video tutorials for key features
- FAQ section with common issues
- Troubleshooting guides

**Support Channels**:

- In-app chat support
- WhatsApp support number
- Email support with 24-hour response
- Community forum for peer support

```typescript
// In-app help system
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: "getting-started" | "features" | "troubleshooting";
  language: "en" | "hi" | "ml";
  videoUrl?: string;
  lastUpdated: Date;
}

// Contextual help component
export function ContextualHelp({ feature }: { feature: string }) {
  const helpArticles = useHelpArticles(feature);

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          {helpArticles.map((article) => (
            <div key={article.id}>
              <h4 className="font-semibold">{article.title}</h4>
              <p className="text-sm text-gray-600">{article.content}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

## 13. Future Roadmap

### 13.1 Phase 2 Enhancements (Months 6-12)

**Advanced AI Features**:

- Predictive crop yield modeling
- Optimal planting time recommendations
- Pest outbreak prediction using weather patterns
- Personalized fertilizer recommendations based on soil analysis

**IoT Integration**:

```typescript
// IoT sensor integration architecture
interface SensorData {
  sensorId: string;
  farmId: string;
  sensorType: "soil_moisture" | "temperature" | "ph" | "rainfall";
  value: number;
  unit: string;
  timestamp: Date;
  batteryLevel?: number;
}

// Real-time sensor monitoring
export function useSensorData(farmId: string) {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);

  useEffect(() => {
    const subscription = supabase
      .channel("sensor-data")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        (payload) => {
          setSensorData((prev) => [...prev, payload.new as SensorData]);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [farmId]);

  return sensorData;
}
```

**Marketplace Integration**:

- Direct buyer-seller connections
- Price negotiation platform
- Quality certification system
- Logistics coordination

### 13.2 Phase 3 Scaling (Year 2)

**Multi-State Expansion**:

- Adaptation for different regional crops
- Local language support (Tamil, Telugu, Kannada)
- State-specific government scheme integration
- Regional agricultural expert networks

**Advanced Analytics**:

```typescript
// Farm performance analytics
interface FarmPerformanceMetrics {
  farmId: string;
  season: string;
  cropYield: {
    crop: string;
    expectedYield: number;
    actualYield: number;
    efficiency: number;
  }[];
  profitability: {
    totalInvestment: number;
    totalRevenue: number;
    netProfit: number;
    roi: number;
  };
  sustainabilityScore: number;
  benchmarkComparison: {
    regional_average: number;
    top_performers: number;
  };
}
```

**Enterprise Features**:

- Agricultural extension officer dashboard
- Bulk farmer management
- Regional analytics and reporting
- Integration with agricultural universities

---

## 14. Risk Assessment & Mitigation

### 14.1 Technical Risks

| Risk                     | Impact | Probability | Mitigation Strategy                                           |
| ------------------------ | ------ | ----------- | ------------------------------------------------------------- |
| API Rate Limits          | High   | Medium      | Implement caching, request queuing, and fallback options      |
| AI Model Accuracy        | High   | Medium      | Continuous model training, user feedback integration          |
| Mobile Performance       | Medium | High        | Progressive loading, image optimization, offline capabilities |
| Third-party Dependencies | Medium | Low         | Vendor diversification, backup service providers              |

### 14.2 Business Risks

| Risk                  | Impact | Probability | Mitigation Strategy                                       |
| --------------------- | ------ | ----------- | --------------------------------------------------------- |
| Low User Adoption     | High   | Medium      | User research, iterative improvements, local partnerships |
| Language Barriers     | Medium | High        | Native language support, audio interfaces, visual guides  |
| Internet Connectivity | Medium | High        | Offline mode, SMS alerts, progressive sync                |
| Competition           | Medium | Medium      | Unique value proposition, continuous innovation           |

### 14.3 Regulatory Risks

**Data Protection Compliance**:

- GDPR-like data protection measures
- User consent management
- Data retention policies
- Right to data portability

**Agricultural Regulations**:

- Compliance with pesticide recommendations
- Organic certification guidelines
- Government scheme eligibility criteria
- Agricultural data sharing regulations

---

## 15. Success Metrics & KPIs

### 15.1 User Engagement Metrics

**Primary KPIs**:

- **Monthly Active Users (MAU)**: Target 10,000+ within first year
- **Daily Active Users (DAU)**: Target 30% of MAU
- **Session Duration**: Average 20+ minutes per session
- **Feature Adoption Rate**: 80% users using core features
- **User Retention**: 60% 30-day retention rate

**Secondary KPIs**:

- Chat interactions per user per day
- Voice vs text usage ratio
- Disease detection usage frequency
- Expense tracking completion rate
- Weather alert engagement rate

### 15.2 Business Impact Metrics

**Farmer Productivity**:

- Crop yield improvement (target: 15-20%)
- Cost reduction through better expense tracking
- Time saved on record-keeping activities
- Successful government scheme applications

**Platform Growth**:

```typescript
// Analytics dashboard queries
const getUserGrowthMetrics = async () => {
  const { data: monthlySignups } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: activeUsers } = await supabase
    .from("activities")
    .select("user_id")
    .gte("created_at", thirtyDaysAgo)
    .group("user_id");

  return {
    newSignups: monthlySignups.length,
    activeUsers: activeUsers.length,
    growthRate: calculateGrowthRate(monthlySignups),
  };
};
```

### 15.3 Technical Performance Metrics

**System Reliability**:

- 99.9% uptime target
- < 3 second page load time
- < 500ms API response time
- Zero critical security vulnerabilities

**AI Performance**:

- Crop disease detection accuracy > 85%
- Chat response relevance score > 90%
- Voice recognition accuracy > 80% for Malayalam

---

## 16. Conclusion

### 16.1 Project Summary

Crop-Synth represents a comprehensive solution to address the digital divide in Kerala's agricultural sector. By combining modern web technologies with AI-powered insights, the platform creates a personalized farming companion that can significantly improve farmer productivity and profitability.

### 16.2 Key Success Factors

**Technical Excellence**:

- Modern, responsive web architecture
- Reliable AI integrations
- Multilingual support
- Mobile-optimized user experience

**User-Centric Design**:

- Intuitive interface design
- Voice-first interaction model
- Contextual, personalized recommendations
- Comprehensive activity tracking

**Business Value**:

- Clear ROI through improved farming outcomes
- Reduced operational costs
- Enhanced access to government benefits
- Community building and knowledge sharing

### 16.3 Call to Action

This PRD provides a comprehensive roadmap for building Crop-Synth as a transformative digital platform for Kerala's farmers. The technical architecture leverages modern web technologies while the feature set addresses real farming challenges with practical, AI-powered solutions.

**Next Steps**:

1. **Development Setup**: Initialize Next.js project with Supabase integration
2. **Team Assembly**: Frontend developer, backend developer, UI/UX designer
3. **API Credentials**: Obtain necessary API keys (Groq, OpenWeather, Google Translate)
4. **User Research**: Conduct initial farmer interviews for validation
5. **MVP Development**: Focus on core features with 8-week delivery timeline

The success of Crop-Synth will be measured not just in technical metrics, but in its real-world impact on Kerala's farming community—helping farmers make better decisions, increase productivity, and build sustainable agricultural practices for the future.

---

## 17. Appendices

### Appendix A: Database Migration Scripts

```sql
-- Initial database setup
-- Run these migrations in Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE activity_type AS ENUM ('sowing', 'irrigation', 'spraying', 'harvesting', 'weeding', 'fertilizing');
CREATE TYPE expense_category AS ENUM ('seeds', 'fertilizers', 'pesticides', 'labor', 'equipment', 'other');
CREATE TYPE scheme_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');

-- Create tables with all constraints
-- (Previously defined schema with additional indexes)

-- Add indexes for performance
CREATE INDEX idx_farms_user_id ON farms(user_id);
CREATE INDEX idx_activities_farm_id ON activities(farm_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_expenses_farm_id ON expenses(farm_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_sales_farm_id ON sales(farm_id);
CREATE INDEX idx_crop_health_farm_id ON crop_health_records(farm_id);
CREATE INDEX idx_chat_user_id ON chat_conversations(user_id);

-- Row Level Security policies
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (as previously defined)
```

### Appendix B: Component Examples

```typescript
// Example: Weather Dashboard Component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Sun, CloudRain, Thermometer, Droplets } from "lucide-react";

interface WeatherDashboardProps {
  weatherData: WeatherData;
  farmingAdvice: string[];
}

export function WeatherDashboard({
  weatherData,
  farmingAdvice,
}: WeatherDashboardProps) {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case "cloudy":
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case "rainy":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      default:
        return <Sun className="h-8 w-8" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Current Weather */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Weather</CardTitle>
          {getWeatherIcon(weatherData.current.conditions)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {weatherData.current.temperature}°C
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>{weatherData.current.humidity}% Humidity</span>
          </div>
        </CardContent>
      </Card>

      {/* Farming Advice */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Today's Farming Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {farmingAdvice.map((advice, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Badge variant="secondary" className="mt-0.5">
                  Tip
                </Badge>
                <p className="text-sm">{advice}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weatherData.forecast.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs font-medium">{day.date}</p>
                {getWeatherIcon(day.conditions)}
                <p className="text-xs">
                  {day.maxTemp}°/{day.minTemp}°
                </p>
                <p className="text-xs text-blue-600">{day.precipitation}mm</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Appendix C: API Response Examples

```json
{
  "chatCompletion": {
    "response": "നിങ്ങളുടെ തക്കാളി ചെടിയിൽ വാടൽ രോഗം കാണപ്പെടുന്നു. ഇത് തടയാൻ നല്ല വെള്ളം വറ്റൽ ഉറപ്പാക്കുകയും കോപ്പർ സൾഫേറ്റ് സ്പ്രേ ചെയ്യുകയും വേണം.",
    "english_translation": "Your tomato plant shows signs of wilt disease. To prevent this, ensure good drainage and spray copper sulfate.",
    "suggestions": [
      "How to prepare copper sulfate spray?",
      "When is the best time to spray?",
      "What are signs of recovery?"
    ],
    "conversationId": "conv_123456789"
  },

  "cropDiagnosis": {
    "diagnosis": [
      {
        "disease": "Tomato Late Blight",
        "confidence": 0.89,
        "description": "Fungal disease causing dark lesions on leaves and fruits",
        "severity": "high"
      }
    ],
    "treatments": {
      "organic": [
        "Neem oil spray (10ml per liter water)",
        "Baking soda solution (5g per liter)",
        "Remove affected leaves and dispose properly"
      ],
      "chemical": [
        "Mancozeb 75% WP (2g per liter)",
        "Copper oxychloride 50% WP (3g per liter)"
      ],
      "preventive": [
        "Ensure proper spacing between plants",
        "Avoid overhead watering",
        "Apply mulch around plants"
      ]
    }
  },

  "weatherData": {
    "current": {
      "temperature": 28.5,
      "humidity": 78,
      "rainfall": 0,
      "windSpeed": 12.3,
      "conditions": "partly_cloudy"
    },
    "forecast": [
      {
        "date": "2024-01-15",
        "maxTemp": 31,
        "minTemp": 22,
        "precipitation": 5.2,
        "conditions": "light_rain",
        "humidity": 82
      }
    ],
    "alerts": [
      {
        "type": "heavy_rain",
        "severity": "moderate",
        "message": "Heavy rainfall expected in next 24 hours. Avoid pesticide application.",
        "validUntil": "2024-01-16T18:00:00Z"
      }
    ]
  }
}
```

---

**Document Version**: 1.0
**Last Updated**: [Current Date]
**Prepared By**: Development Team
**Approved By**: Project Stakeholders

---

_This PRD serves as the comprehensive guide for developing Crop-Synth, ensuring all stakeholders have a clear understanding of the project scope, technical requirements, and expected outcomes._
