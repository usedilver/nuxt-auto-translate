# Changelog

## v0.2.0

### Features

- **CLI / on-demand translation**: run `nuxt-auto-translate` as a command to scan and translate once, decoupled from the dev/build lifecycle. Reads the same `autoTranslate` and `@nuxtjs/i18n` config via `loadNuxtConfig`, loads `.env` automatically, and exits. Ideal for a `package.json` script run when a task is finished.
- Export `translate` and `resolveOptions` from the package entry for programmatic use.

### ⚠️ Breaking

- The per-save dev watcher (`builder:watch`) is now **opt-in** via `watch: true` (default `false`). Real-time re-translation on every file save is off by default; prefer the CLI or the `build:before` hook. Set `autoTranslate.watch: true` to restore the previous behavior.

### Internal

- Extracted defaults + i18n auto-detection into a shared, unit-tested `resolveOptions()` used by both the module and the CLI.

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
