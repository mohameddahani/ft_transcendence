# Translations to add (12 texts of the new sign-in pages)

Open `frontend/src/lib/i18n.ts` and paste each block inside the matching language, right after its
`translation: {` line (English at the top of the file, then `fr: {`, then `ar: {`). Without them the pages still
work, but French and Arabic show these texts in English.

## English (inside `en: { translation: {`)

```ts
      // Sign-in pages (Sportium)
      countryCode: "Country code",
      loginPanelTitle: "Run your club with clarity.",
      loginPanelTitle2a: "Built for",
      loginPanelTitle2b: "every sports club.",
      memberNoAccount: "No account yet? Your club creates it when you join.",
      memberPanelTitle: "Your club, in your pocket.",
      otherPortals: "Not your portal? Sign in to yours",
      registerBadge: "For club owners",
      registerPanelTitle: "Bring your club into one place.",
      sportiumCopyright: "© 2026 Sportium. All rights reserved.",
      staffNoAccount: "No account yet? Ask your club's administrator.",
      staffPanelTitle: "Keep the front desk moving.",
```

## French (inside `fr: { translation: {`)

```ts
      // Sign-in pages (Sportium)
      countryCode: "Indicatif",
      loginPanelTitle: "Gérez votre club en toute clarté.",
      loginPanelTitle2a: "Conçu pour",
      loginPanelTitle2b: "tous les clubs sportifs.",
      memberNoAccount: "Pas encore de compte ? Votre club le crée à votre inscription.",
      memberPanelTitle: "Votre club, dans votre poche.",
      otherPortals: "Ce n'est pas votre espace ? Connectez-vous au vôtre",
      registerBadge: "Pour les propriétaires de clubs",
      registerPanelTitle: "Tout votre club au même endroit.",
      sportiumCopyright: "© 2026 Sportium. Tous droits réservés.",
      staffNoAccount: "Pas encore de compte ? Demandez à l'administrateur de votre club.",
      staffPanelTitle: "Un accueil fluide, toute la journée.",
```

## Arabic (inside `ar: { translation: {`)

```ts
      // Sign-in pages (Sportium)
      countryCode: "رمز البلد",
      loginPanelTitle: "أدِر ناديك بوضوح.",
      loginPanelTitle2a: "مصمَّم لجميع",
      loginPanelTitle2b: "الأندية الرياضية.",
      memberNoAccount: "ليس لديك حساب بعد؟ ينشئه ناديك عند اشتراكك.",
      memberPanelTitle: "ناديك في جيبك.",
      otherPortals: "ليست بوابتك؟ سجّل الدخول إلى بوابتك",
      registerBadge: "لأصحاب الأندية",
      registerPanelTitle: "اجمع كل ما يخص ناديك في مكان واحد.",
      sportiumCopyright: "© 2026 Sportium. جميع الحقوق محفوظة.",
      staffNoAccount: "ليس لديك حساب بعد؟ اطلبه من مسؤول ناديك.",
      staffPanelTitle: "استقبال سلس طوال اليوم.",
```
