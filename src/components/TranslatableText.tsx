'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';

interface TranslatableTextProps {
  text: string;
  className?: string;
}

export default function TranslatableText({ text, className }: TranslatableTextProps) {
  const { language, translate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(text);
    } else {
      translate(text).then(setTranslatedText);
    }
  }, [text, language, translate]);

  return <span className={className}>{translatedText}</span>;
}