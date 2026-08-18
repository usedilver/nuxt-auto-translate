import type { ModuleOptions } from '../types'

/**
 * Minimal shape of the `@nuxtjs/i18n` config this module reads for auto-detection.
 */
export interface I18nConfig {
  defaultLocale?: string
  locales?: Array<string | { code: string, name?: string, file?: string }>
  langDir?: string
}

/**
 * Module option defaults. Applied by `defineNuxtModule` at setup time, and
 * re-applied by the CLI, which loads raw config without running the module.
 */
export const DEFAULT_OPTIONS: ModuleOptions = {
  enabled: false,
  provider: 'openai',
  watch: false,
  locales: [],
  outputPath: 'i18n/locales',
  targetFolders: ['assets', 'components', 'composables', 'layouts', 'middleware', 'pages', 'plugins', 'store', 'utils'],
  rootFiles: [],
  fileExtensions: ['.vue', '.ts', '.js'],
  enableCache: true,
  cleanOrphaned: false,
  backupBeforeClean: true,
  maxBackups: 3,
}

/**
 * Merges defaults, auto-detects locale settings from `@nuxtjs/i18n`, and applies
 * final fallbacks. Shared by the Nuxt module and the CLI so both resolve options
 * identically.
 */
export function resolveOptions(userOptions: Partial<ModuleOptions>, i18nConfig?: I18nConfig): ModuleOptions {
  const options: ModuleOptions = { ...DEFAULT_OPTIONS, ...userOptions, locales: [...(userOptions.locales ?? [])] }

  if (i18nConfig) {
    if (!options.defaultLocale && i18nConfig.defaultLocale) {
      options.defaultLocale = i18nConfig.defaultLocale
      console.log(`[nuxt-auto-translate] Auto-detected defaultLocale: "${i18nConfig.defaultLocale}" from @nuxtjs/i18n`)
    }

    if (options.locales.length === 0 && Array.isArray(i18nConfig.locales)) {
      const defaultLocale = options.defaultLocale || i18nConfig.defaultLocale || 'es'

      options.locales = i18nConfig.locales
        .filter((locale) => {
          const code = typeof locale === 'string' ? locale : locale.code
          return code !== defaultLocale
        })
        .map((locale) => {
          if (typeof locale === 'string') {
            return { code: locale, name: locale }
          }
          return { code: locale.code, name: locale.name || locale.code, file: locale.file }
        })

      if (options.locales.length > 0) {
        const codes = options.locales.map(l => l.code).join(', ')
        console.log(`[nuxt-auto-translate] Auto-detected locales from @nuxtjs/i18n: [${codes}]`)
      }
    }

    if (!options.outputPath && i18nConfig.langDir) {
      options.outputPath = i18nConfig.langDir
      console.log(`[nuxt-auto-translate] Auto-detected outputPath: "${i18nConfig.langDir}" from @nuxtjs/i18n langDir`)
    }
  }

  if (!options.defaultLocale) {
    options.defaultLocale = 'es'
  }

  return options
}
