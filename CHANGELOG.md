# Changelog

## v0.1.1

### Features

- Auto-detect `defaultLocale`, `locales`, and `outputPath` from `@nuxtjs/i18n` config
- No need to duplicate i18n settings — just enable the module
- Supports both standalone and `@nuxtjs/i18n` integration
- Console logs when config is auto-detected for transparency

### Bug Fixes

- Always write new keys to the default locale file (e.g., `es.json`)
- Fixed issue where auto-detected locales excluded `defaultLocale` from the translation loop, causing missing source keys

## v0.1.0

### Features

- Multiple LLM providers: OpenAI, Anthropic (Claude), Google Gemini, Groq, and Ollama
- Automatic scanning of `$t()` calls in `.vue`, `.ts`, and `.js` files
- Smart caching: only translates new keys, preserves existing translations
- Batch translation for efficient processing of large translation sets
- Validation of variables `{name}` and HTML tags preservation
- Orphan cleanup: optionally removes translations no longer in use
- Automatic backup system before making changes
- Environment variable configuration support
- Nuxt 3 module with `build:before` and `builder:watch` hooks
