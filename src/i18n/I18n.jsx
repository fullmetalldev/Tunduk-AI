import { useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, translations } from "./translations";
import { I18nContext } from "./useI18n";

const STORAGE_KEY = "language";

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
  } catch {
    // localStorage unavailable - fall back to default
  }
  return DEFAULT_LANGUAGE;
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const t = (key) =>
    translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};
