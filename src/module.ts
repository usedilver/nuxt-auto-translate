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
    defaultLocale: 'es',
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

    // Validate configuration
    if (options.locales.length === 0) {
      console.warn('[nuxt-auto-translate] No locales configured. Module disabled.')
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
