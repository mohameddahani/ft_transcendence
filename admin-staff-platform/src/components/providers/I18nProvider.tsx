"use client";

import React, { useEffect, useState } from "react";
import i18n from "@/lib/i18n";
import { I18nextProvider } from "react-i18next";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateDirAndLang = (lng: string) => {
      const isRtl = lng.startsWith("ar");
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = lng;
    };

    updateDirAndLang(i18n.language || "en");

    const handleLanguageChanged = (lng: string) => {
      updateDirAndLang(lng);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
