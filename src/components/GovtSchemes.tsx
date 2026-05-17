'use client';

import { Card } from './ui/card';
import { useMemo } from 'react';
interface Scheme {
  id: string;
  title: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  deadlines: {
    main: string;
    reminder: string;
  };
  application: string;
}

const schemes: Scheme[] = [
  {
    id: 'pm-kisan',
    title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    description: 'Direct income support scheme providing financial assistance to small and marginal farmers.',
    eligibility: [
      'Landholding farmer families with cultivable land up to 2 hectares',
      'Excludes institutional landholders, higher-income families',
      'Aadhaar-linked bank account required for verification'
    ],
    benefits: [
      '₹6,000 per year, disbursed in three equal installments of ₹2,000 every four months',
      'Helps meet agricultural and domestic expenses, reducing reliance on moneylenders'
    ],
    deadlines: {
      main: 'Ongoing scheme; e-KYC must be completed by March 31, 2025',
      reminder: 'Complete e-KYC annually to avoid payment suspension'
    },
    application: 'Register on pmkisan.gov.in or via Common Service Centers (CSCs)'
  },
  {
    id: 'pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'Crop insurance scheme protecting farmers against crop losses due to natural calamities, pests, or diseases.',
    eligibility: [
      'All farmers (loanee and non-loanee) growing notified crops in notified areas',
      'Must have insurable interest in the crop'
    ],
    benefits: [
      'Low premium: 2% for Kharif crops, 1.5% for Rabi crops, 5% for horticultural/commercial crops',
      'Covers yield loss, prevented sowing, post-harvest losses, and localized calamities',
      'Claim settlement up to 90-100% of insured amount in case of loss'
    ],
    deadlines: {
      main: 'Kharif 2025: July 31, 2025; Rabi 2025-26: December 31, 2025',
      reminder: 'Enroll before sowing season to avoid missing coverage'
    },
    application: 'Through banks, CSCs, or pmfby.gov.in'
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC) Scheme',
    description: 'Provides short-term credit for cultivation needs at concessional rates.',
    eligibility: [
      'Small and marginal farmers, sharecroppers, and oral lessees',
      'Must have a good credit history and viable farming project'
    ],
    benefits: [
      'Loan up to ₹3 lakh at 4% interest (with prompt repayment rebate up to 3%)',
      'Flexible repayment linked to crop cycles',
      'Personal accident insurance up to ₹50,000 and life insurance up to ₹30,000'
    ],
    deadlines: {
      main: 'Apply by June 2025 for Kharif season',
      reminder: 'Renew KCC every 5 years; interest claims by March 31, 2026'
    },
    application: 'At scheduled banks, cooperatives, or regional rural banks'
  },
  {
    id: 'pmksy',
    title: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
    description: 'Promotes efficient water use in agriculture through micro-irrigation and watershed management.',
    eligibility: [
      'Farmers with cultivable land; priority to small/marginal farmers',
      'Projects approved by state-level technical committees'
    ],
    benefits: [
      'Subsidy up to 55% for micro-irrigation systems for small farmers',
      'Improves crop yield by 20-50%, saves water, and reduces energy costs',
      'Access to watershed development funds'
    ],
    deadlines: {
      main: 'Proposals due by September 30, 2025',
      reminder: 'Subsidies disbursed within 30 days of approval'
    },
    application: 'Through state agriculture departments or pmksy.gov.in'
  },
  {
    id: 'shc',
    title: 'Soil Health Card (SHC) Scheme',
    description: 'Provides soil testing and customized fertilizer recommendations to optimize input use.',
    eligibility: [
      'All farmers with landholdings',
      'Distributed every 2 years per farm'
    ],
    benefits: [
      'Free soil health cards with nutrient status and recommendations',
      'Reduces fertilizer overuse by 8-10%',
      'Increases yields by 5-10% and saves costs'
    ],
    deadlines: {
      main: 'Next cycle distribution starts April 2025',
      reminder: 'Apply for renewal by December 31, 2025'
    },
    application: 'At soil testing labs, CSCs, or state agriculture offices'
  },
  {
    id: 'nmnf',
    title: 'National Mission on Natural Farming (NMNF)',
    description: 'Promotes chemical-free, natural farming practices for sustainable agriculture.',
    eligibility: [
      'Farmers adopting natural farming on at least 0.5 hectares',
      'Training completion required for certification'
    ],
    benefits: [
      'Subsidies for bio-inputs up to ₹5,000 per hectare',
      'Certification for premium pricing of organic produce',
      'Reduces input costs by 20-30%'
    ],
    deadlines: {
      main: 'Registration open till June 30, 2025',
      reminder: 'Training sessions by March 2025'
    },
    application: 'Via state organic farming missions or nmnf.nic.in'
  },
  {
    id: 'aif',
    title: 'Agriculture Infrastructure Fund (AIF)',
    description: 'Medium to long-term debt financing for post-harvest infrastructure.',
    eligibility: [
      'Farmers, FPOs, cooperatives, or agri-entrepreneurs',
      'Credit appraisal by scheduled banks'
    ],
    benefits: [
      '3% interest subvention on loans up to ₹2 crore for 7 years',
      'Credit guarantee up to 25% of project cost',
      'Reduces post-harvest losses by 10-15%'
    ],
    deadlines: {
      main: 'Project proposals due by December 31, 2025',
      reminder: 'Apply 3 months before infrastructure needs'
    },
    application: 'Through banks or agriinfra.dac.gov.in'
  },
  {
    id: 'fpo',
    title: 'Formation and Promotion of Farmer Producer Organizations (FPO)',
    description: 'Supports creation of FPOs for collective bargaining and value addition.',
    eligibility: [
      'Groups of 300-800 farmers in a cluster',
      'Focus on small/marginal farmers in eligible blocks'
    ],
    benefits: [
      'Financial aid up to ₹18 lakh per FPO for 3 years',
      'Matching equity grant up to ₹15 lakh',
      'Increases income by 20-30%'
    ],
    deadlines: {
      main: 'New FPO formation applications by September 30, 2025',
      reminder: 'Annual compliance reporting by March 31'
    },
    application: 'Via sfacindia.com or state agencies'
  }
];

const parseDate = (dateStr: string): Date | null => {
  try {
    // Handle different date formats
    const formats = [
      // March 31, 2025
      /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
      // 31 March 2025
      /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
      // 2025-03-31
      /(\d{4})-(\d{2})-(\d{2})/,
      // 31/03/2025
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

const isSchemeExpired = (deadline: string): boolean => {
  try {
    // Extract dates using common patterns
    const datePattern = /\b(\d{1,2}[-\/\s][A-Za-z]+[-\/\s]\d{4}|\d{4}[-\/\s][A-Za-z]+[-\/\s]\d{1,2}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})\b/gi;
    const dates = deadline.match(datePattern);

    if (!dates) return false;

    const currentDate = new Date();

    // Parse and check each found date
    return dates.some(dateStr => {
      const parsedDate = parseDate(dateStr);
      return parsedDate ? parsedDate < currentDate : false;
    });
  } catch (error) {
    console.error('Error checking scheme expiry:', error);
    return false;
  }
};

export default function GovtSchemes() {
  const currentSchemes = useMemo(() => {
    try {
      return schemes.map(scheme => ({
        ...scheme,
        isExpired: isSchemeExpired(scheme.deadlines.main)
      }));
    } catch (error) {
      console.error('Error processing schemes:', error);
      return [];
    }
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-emerald-700">Government Agricultural Schemes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentSchemes.map((scheme) => (
          <Card
            key={scheme.id}
            className={`p-6 transition-all ${
              scheme.isExpired
                ? "bg-gray-100/80 opacity-60"
                : "hover:shadow-lg bg-white/80 backdrop-blur-sm"
            }`}
          >
            <div className="relative">
              {scheme.isExpired && (
                <div className="absolute top-0 right-0">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                    Expired
                  </span>
                </div>
              )}
              <h2 className={`text-xl font-semibold mb-3 ${
                scheme.isExpired ? 'text-gray-500' : 'text-emerald-600'
              }`}>
                {scheme.title}
              </h2>
              <p className={`mb-4 text-sm ${
                scheme.isExpired ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {scheme.description}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className={`font-medium mb-2 ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  Eligibility
                </h3>
                <ul className={`list-disc list-inside text-sm space-y-1 ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {scheme.eligibility.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className={`font-medium mb-2 ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  Benefits
                </h3>
                <ul className={`list-disc list-inside text-sm space-y-1 ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {scheme.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className={`font-medium mb-2 ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  Important Dates
                </h3>
                <div className={`text-sm ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  <p>{scheme.deadlines.main}</p>
                  <p className={scheme.isExpired ? 'text-gray-500 mt-1' : 'text-amber-600 mt-1'}>
                    ⏰ Reminder: {scheme.deadlines.reminder}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className={`font-medium mb-1 ${
                  scheme.isExpired ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  How to Apply
                </h3>
                <p className={`text-sm ${
                  scheme.isExpired ? 'text-gray-500' : 'text-emerald-600'
                }`}>
                  {scheme.application}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Eligibility</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {scheme.eligibility.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Benefits</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {scheme.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Important Dates</h3>
                <div className="text-sm text-gray-600">
                  <p>{scheme.deadlines.main}</p>
                  <p className="text-amber-600 mt-1">⏰ Reminder: {scheme.deadlines.reminder}</p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="font-medium text-gray-900 mb-1">How to Apply</h3>
                <p className="text-sm text-emerald-600">{scheme.application}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}