#!/usr/bin/env node
import process from 'node:process'
import { join } from 'node:path'
import { loadNuxtConfig } from '@nuxt/kit'
import { resolveOptions, translate } from '../dist/module.mjs'

async function main() {
  const cwd = process.cwd()

  // Nuxt loads .env at dev/build time; a standalone run does not, so provider
  // keys and config env vars must be loaded here before reading the config.
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(join(cwd, '.env'))
    }
    catch {
      // No .env file — rely on the shell environment.
    }
  }

  const config = await loadNuxtConfig({ cwd })
  const options = resolveOptions(config.autoTranslate ?? {}, config.i18n)

  const targets = options.locales
    .filter(locale => locale.code !== options.defaultLocale)
    .map(locale => locale.code)

  if (targets.length === 0) {
    console.error('[nuxt-auto-translate] No target locales resolved. Configure `autoTranslate.locales` or `@nuxtjs/i18n` locales.')
    process.exit(1)
  }

  console.log(`[nuxt-auto-translate] Provider "${options.provider}" — ${options.defaultLocale} → ${targets.join(', ')}`)

  await translate(config.srcDir ?? cwd, options)

  console.log('[nuxt-auto-translate] Done.')
}

main().catch((error) => {
  console.error('[nuxt-auto-translate] Translation failed:', error)
  process.exit(1)
})
