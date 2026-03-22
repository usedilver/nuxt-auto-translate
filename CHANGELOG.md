# Changelog

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
