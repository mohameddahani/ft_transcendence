"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

export const defaultNS = "translation";
export const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      language: "Language",
    },
  },
  fr: {
    translation: {
      welcome: "Bienvenue",
      language: "Langue",
    },
  },
  ar: {
    translation: {
      welcome: "مرحباً",
      language: "اللغة",
    },
  },
} as const;

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });
}

export default i18n;
