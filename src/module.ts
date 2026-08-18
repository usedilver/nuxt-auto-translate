import { defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions } from './types'
import { DEFAULT_OPTIONS, resolveOptions, type I18nConfig } from './core/resolve-options'

export type { ModuleOptions } from './types'

// Re-exported so the CLI (bin/cli.mjs) can run a translation on demand.
export { resolveOptions } from './core/resolve-options'
export { translate } from './core/translate'

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
  defaults: DEFAULT_OPTIONS,
  async setup(options, nuxt) {
    // Skip if not enabled
    if (!options.enabled) {
      return
    }

    const i18nConfig = (nuxt.options as Record<string, unknown>).i18n as I18nConfig | undefined
    const resolved = resolveOptions(options, i18nConfig)

    // Validate configuration
    if (resolved.locales.length === 0) {
      console.warn('[nuxt-auto-translate] No locales configured (and could not detect from @nuxtjs/i18n). Module disabled.')
      return
    }

    // Hook: Before build
    nuxt.hook('build:before', async () => {
      if (isRunning) return
      isRunning = true

      try {
        const { translate } = await import('./core/translate')
        await translate(nuxt.options.srcDir, resolved)
      }
      finally {
        isRunning = false
      }
    })

    // Hook: Watch for file changes in development (opt-in via `watch: true`)
    if (resolved.watch) {
      nuxt.hook('builder:watch', async (_event, path) => {
        if (isRunning) return

        const ignorePaths = resolved.ignorePaths || [resolved.outputPath!]
        const shouldIgnore = ignorePaths.some(ignorePath => path.includes(ignorePath))
        if (shouldIgnore) return

        const isTargetFile = resolved.fileExtensions?.some(ext => path.endsWith(ext))
        if (!isTargetFile) return

        isRunning = true

        try {
          const { translate } = await import('./core/translate')
          await translate(nuxt.options.srcDir, resolved)
        }
        finally {
          isRunning = false
        }
      })
    }
  },
})
