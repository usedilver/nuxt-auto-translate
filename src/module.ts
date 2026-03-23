import { defineNuxtModule, createResolver } from '@nuxt/kit'
import type { ModuleOptions } from './types'

export type { ModuleOptions } from './types'

// Track if translation is already running (debounce)
let isRunning = false

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-auto-translate',
    configKey: 'autoTranslate',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    enabled: false,
    provider: 'openai',
    locales: [],
    outputPath: 'i18n/locales',
    targetFolders: ['assets', 'components', 'composables', 'layouts', 'middleware', 'pages', 'plugins', 'store', 'utils'],
    rootFiles: [],
    fileExtensions: ['.vue', '.ts', '.js'],
    enableCache: true,
    cleanOrphaned: false,
    backupBeforeClean: true,
    maxBackups: 3,
  },
  async setup(options, nuxt) {
    // Skip if not enabled
    if (!options.enabled) {
      return
    }

    // Auto-detect config from @nuxtjs/i18n if available
    const i18nConfig = (nuxt.options as Record<string, any>).i18n

    if (i18nConfig) {
      // Use i18n defaultLocale as fallback
      if (!options.defaultLocale && i18nConfig.defaultLocale) {
        options.defaultLocale = i18nConfig.defaultLocale
        console.log(`[nuxt-auto-translate] Auto-detected defaultLocale: "${i18nConfig.defaultLocale}" from @nuxtjs/i18n`)
      }

      // Use i18n locales as fallback (exclude the defaultLocale — it's the source language)
      if (options.locales.length === 0 && Array.isArray(i18nConfig.locales)) {
        const defaultLocale = options.defaultLocale || i18nConfig.defaultLocale || 'es'

        options.locales = i18nConfig.locales
          .filter((locale: any) => {
            const code = typeof locale === 'string' ? locale : locale.code
            return code !== defaultLocale
          })
          .map((locale: any) => {
            if (typeof locale === 'string') {
              return { code: locale, name: locale }
            }
            return {
              code: locale.code,
              name: locale.name || locale.code,
              file: locale.file,
            }
          })

        if (options.locales.length > 0) {
          const codes = options.locales.map(l => l.code).join(', ')
          console.log(`[nuxt-auto-translate] Auto-detected locales from @nuxtjs/i18n: [${codes}]`)
        }
      }

      // Use i18n langDir as fallback for outputPath
      if (!options.outputPath && i18nConfig.langDir) {
        options.outputPath = i18nConfig.langDir
        console.log(`[nuxt-auto-translate] Auto-detected outputPath: "${i18nConfig.langDir}" from @nuxtjs/i18n langDir`)
      }
    }

    // Apply default if still not set
    if (!options.defaultLocale) {
      options.defaultLocale = 'es'
    }

    // Validate configuration
    if (options.locales.length === 0) {
      console.warn('[nuxt-auto-translate] No locales configured (and could not detect from @nuxtjs/i18n). Module disabled.')
      return
    }

    const _resolver = createResolver(import.meta.url)

    // Hook: Before build
    nuxt.hook('build:before', async () => {
      if (isRunning) return
      isRunning = true

      try {
        const { translate } = await import('./core/translate')
        await translate(nuxt.options.srcDir, options)
      } finally {
        isRunning = false
      }
    })

    // Hook: Watch for file changes in development
    nuxt.hook('builder:watch', async (_event, path) => {
      if (isRunning) return

      // Check if path should be ignored
      const ignorePaths = options.ignorePaths || [options.outputPath]
      const shouldIgnore = ignorePaths.some(ignorePath => path.includes(ignorePath))

      if (shouldIgnore) return

      // Only translate on changes to target file types
      const isTargetFile = options.fileExtensions?.some(ext => path.endsWith(ext))
      if (!isTargetFile) return

      isRunning = true

      try {
        const { translate } = await import('./core/translate')
        await translate(nuxt.options.srcDir, options)
      } finally {
        isRunning = false
      }
    })
  },
})
