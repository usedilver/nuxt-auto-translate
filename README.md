# nuxt-auto-translate

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Automatic i18n translations for Nuxt using LLMs (OpenAI, Anthropic/Claude, Gemini, Groq, Ollama).

Scans your source code for `$t()` calls, extracts translation keys, and automatically translates them using your preferred AI provider.

- [Release Notes](/CHANGELOG.md)

## Features

- **Multiple LLM Providers**: OpenAI, Anthropic (Claude), Google Gemini, Groq, and Ollama (local)
- **Automatic Scanning**: Detects `$t()` calls in `.vue`, `.ts`, and `.js` files
- **Smart Caching**: Only translates new keys, preserves existing translations
- **Batch Translation**: Efficient batch processing for large translation sets
- **Validation**: Validates that variables `{name}` and HTML tags are preserved
- **Orphan Cleanup**: Optionally removes translations no longer in use
- **Backup System**: Automatic backups before making changes

## Quick Setup

Install the module:

```bash
npm install nuxt-auto-translate
# or
pnpm add nuxt-auto-translate
```

Install your preferred provider SDK (only install what you need):

```bash
# OpenAI (default)
npm install openai

# Anthropic (Claude)
npm install @anthropic-ai/sdk

# Google Gemini
npm install @google/generative-ai

# Groq or Ollama - uses openai package
npm install openai
```

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-auto-translate'],

  autoTranslate: {
    enabled: true,
    provider: 'openai', // or 'anthropic', 'gemini', 'groq', 'ollama'
    defaultLocale: 'es',
    locales: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
    ],
    outputPath: 'i18n/locales', // Where to save translation JSON files
  },
})
```

Set your API key in `.env`:

```bash
NUXT_AUTO_TRANSLATE_OPENAI_KEY=sk-your-key-here
```

## Configuration

### Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable/disable auto-translate |
| `provider` | `string` | `'openai'` | LLM provider to use |
| `defaultLocale` | `string` | `'es'` | Source language code |
| `locales` | `LocaleConfig[]` | `[]` | List of target locales |
| `outputPath` | `string` | `'i18n/locales'` | Output directory for JSON files |
| `backupPath` | `string` | - | Backup directory (optional) |
| `targetFolders` | `string[]` | `['components', 'pages', ...]` | Folders to scan |
| `rootFiles` | `string[]` | `[]` | Root files to scan (e.g., `app.vue`) |
| `fileExtensions` | `string[]` | `['.vue', '.ts', '.js']` | File types to scan |
| `enableCache` | `boolean` | `true` | Only translate new keys |
| `cleanOrphaned` | `boolean` | `false` | Remove unused translations |
| `backupBeforeClean` | `boolean` | `true` | Backup before cleaning |
| `maxBackups` | `number` | `3` | Max backups per locale |

### Environment Variables

```bash
# Select provider (optional, can be set in config)
NUXT_AUTO_TRANSLATE_PROVIDER=openai

# OpenAI
NUXT_AUTO_TRANSLATE_OPENAI_KEY=sk-xxx
NUXT_AUTO_TRANSLATE_OPENAI_MODEL=gpt-4o-mini

# Anthropic
NUXT_AUTO_TRANSLATE_ANTHROPIC_KEY=sk-ant-xxx
NUXT_AUTO_TRANSLATE_ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Gemini
NUXT_AUTO_TRANSLATE_GEMINI_KEY=AIzaSyxxx
NUXT_AUTO_TRANSLATE_GEMINI_MODEL=gemini-2.0-flash-exp

# Groq
NUXT_AUTO_TRANSLATE_GROQ_KEY=gsk_xxx
NUXT_AUTO_TRANSLATE_GROQ_MODEL=llama-3.3-70b-versatile

# Ollama (local - no API key needed)
NUXT_AUTO_TRANSLATE_OLLAMA_MODEL=llama3.2
NUXT_AUTO_TRANSLATE_OLLAMA_BASE_URL=http://localhost:11434/v1
```

### Locale Configuration

```typescript
interface LocaleConfig {
  code: string  // e.g., 'en', 'es', 'fr'
  name: string  // e.g., 'English', 'Español', 'Français'
  file?: string // Optional custom filename
}
```

## Usage

Once configured, the module will:

1. **On build**: Scan source code and translate new keys
2. **On dev watch**: Re-translate when source files change

### In your components

```vue
<template>
  <h1>{{ $t('Welcome to our app') }}</h1>
  <p>{{ $t('Hello {name}, you have {count} messages', { name, count }) }}</p>
</template>
```

### Output

The module generates JSON files in your `outputPath`:

```json
// i18n/locales/es.json (default locale - key = value)
{
  "Welcome to our app": "Welcome to our app",
  "Hello {name}, you have {count} messages": "Hello {name}, you have {count} messages"
}

// i18n/locales/en.json (translated)
{
  "Welcome to our app": "Bienvenido a nuestra app",
  "Hello {name}, you have {count} messages": "Hola {name}, tienes {count} mensajes"
}
```

## Provider Comparison

| Provider | Cost | Speed | Offline | Best For |
|----------|------|-------|---------|----------|
| OpenAI | $$ | Fast | No | Production, highest quality |
| Anthropic | $$ | Fast | No | Production alternative |
| Gemini | $ | Fast | No | Budget-conscious |
| Groq | $ | Very Fast | No | Speed + economy |
| Ollama | Free | Slow* | Yes | Development, privacy |

*Ollama speed depends on your hardware

## Development

<details>
  <summary>Local development</summary>

```bash
# Install dependencies
npm install

# Generate type stubs
npm run dev:prepare

# Develop with the playground
npm run dev

# Build the playground
npm run dev:build

# Run ESLint
npm run lint

# Run Vitest
npm run test
npm run test:watch

# Release new version
npm run release
```

</details>

## License

[MIT License](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-auto-translate/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-auto-translate

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-auto-translate.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-auto-translate

[license-src]: https://img.shields.io/npm/l/nuxt-auto-translate.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-auto-translate

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
