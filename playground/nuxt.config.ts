export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',

  autoTranslate: {
    enabled: false, // Set to true and configure API keys to test
    provider: 'openai',
    defaultLocale: 'es',
    locales: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
    ],
    outputPath: 'public/i18n',
    cleanOrphaned: true,
  },
})
