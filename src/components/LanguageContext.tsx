'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translateText } from '@/lib/translate';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => Promise<string>;
  translations: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguageState(savedLanguage);
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Clear translations when language changes
    setTranslations({});
  };

  const translate = async (text: string): Promise<string> => {
    if (language === 'en') return text;
    if (translations[text]) return translations[text];

    const translated = await translateText(text, language);
    setTranslations(prev => ({ ...prev, [text]: translated }));
    return translated;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}