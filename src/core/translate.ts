import { initializeProviders, getProvider } from './providers'
import { ScannerService } from './services/scanner.service'
import { TranslatorService } from './services/translator.service'
import { TranslationFileService } from './services/file.service'
import { Logger } from './utils/logger'
import type { ModuleOptions, LocaleConfig, ProviderConfig } from '../types'

const logger = new Logger('auto-translate')

/**
 * Resolves provider configuration from module options and environment variables
 */
function resolveProviderConfig(
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama',
  options: ModuleOptions,
): ProviderConfig {
  const envPrefix = 'NUXT_AUTO_TRANSLATE_'

  switch (provider) {
    case 'openai':
      return {
        apiKey: options.openai?.apiKey || process.env[`${envPrefix}OPENAI_KEY`],
        model: options.openai?.model || process.env[`${envPrefix}OPENAI_MODEL`] || 'gpt-4o-mini',
      }
    case 'anthropic':
      return {
        apiKey: options.anthropic?.apiKey || process.env[`${envPrefix}ANTHROPIC_KEY`],
        model: options.anthropic?.model || process.env[`${envPrefix}ANTHROPIC_MODEL`] || 'claude-3-5-haiku-20241022',
      }
    case 'gemini':
      return {
        apiKey: options.gemini?.apiKey || process.env[`${envPrefix}GEMINI_KEY`],
        model: options.gemini?.model || process.env[`${envPrefix}GEMINI_MODEL`] || 'gemini-2.0-flash-exp',
      }
    case 'groq':
      return {
        apiKey: options.groq?.apiKey || process.env[`${envPrefix}GROQ_KEY`],
        model: options.groq?.model || process.env[`${envPrefix}GROQ_MODEL`] || 'llama-3.3-70b-versatile',
        baseUrl: options.groq?.baseUrl || process.env[`${envPrefix}GROQ_BASE_URL`] || 'https://api.groq.com/openai/v1',
      }
    case 'ollama':
      return {
        model: options.ollama?.model || process.env[`${envPrefix}OLLAMA_MODEL`] || 'llama3.2',
        baseUrl: options.ollama?.baseUrl || process.env[`${envPrefix}OLLAMA_BASE_URL`] || 'http://localhost:11434/v1',
      }
  }
}

/**
 * Main translation function
 * Scans source code for $t() calls and translates new keys
 */
export async function translate(projectRoot: string, options: ModuleOptions): Promise<void> {
  try {
    // Resolve provider from options or env
    const provider = options.provider || (process.env.NUXT_AUTO_TRANSLATE_PROVIDER as any) || 'openai'

    // Initialize the active provider
    await initializeProviders(
      {
        openai: resolveProviderConfig('openai', options),
        anthropic: resolveProviderConfig('anthropic', options),
        gemini: resolveProviderConfig('gemini', options),
        groq: resolveProviderConfig('groq', options),
        ollama: resolveProviderConfig('ollama', options),
      },
      provider,
    )

    const translationProvider = getProvider(provider)
    const fileService = new TranslationFileService(
      projectRoot,
      options.outputPath,
      options.backupPath,
      options.backupBeforeClean ?? true,
      options.maxBackups ?? 3,
    )
    const scanner = new ScannerService(
      projectRoot,
      options.targetFolders || ['components', 'pages', 'composables', 'layouts', 'middleware', 'plugins', 'store', 'utils'],
      options.fileExtensions || ['.vue', '.ts', '.js'],
      options.rootFiles || [],
    )
    const translator = new TranslatorService(translationProvider)

    // Load existing translations for default locale
    const existingTranslations = fileService.load(options.defaultLocale)
    const existingKeys = new Set(Object.keys(existingTranslations))

    // Scan source code
    const scanResult = scanner.scan(options.enableCache !== false ? existingKeys : new Set())

    logger.info(`Found ${scanResult.newKeys.size} new keys`)
    logger.info(`Found ${scanResult.orphanedKeys.size} orphaned keys`)

    if (scanResult.newKeys.size === 0 && scanResult.orphanedKeys.size === 0) {
      logger.info('No changes needed - all translations are up to date')
      return
    }

    if (scanResult.newKeys.size === 0 && !options.cleanOrphaned) {
      logger.info('No new keys to translate and orphaned cleaning is disabled')
      return
    }

    // Get default locale name for translation prompts
    const defaultLocaleName = options.locales.find(l => l.code === options.defaultLocale)?.name || 'Spanish'

    // Translate for each language
    for (const locale of options.locales) {
      logger.info(`Processing ${locale.name} (${locale.code})`)

      if (locale.code === options.defaultLocale) {
        // Default language: key = value
        const translations = Object.fromEntries(Array.from(scanResult.newKeys).map(k => [k, k]))
        const existing = fileService.load(locale.code)
        let merged = { ...existing, ...translations }

        // Clean orphaned keys if enabled
        if (options.cleanOrphaned && scanResult.orphanedKeys.size > 0) {
          const beforeCount = Object.keys(merged).length
          merged = Object.fromEntries(Object.entries(merged).filter(([k]) => scanResult.allKeys.has(k)))
          const removedCount = beforeCount - Object.keys(merged).length

          if (removedCount > 0) {
            logger.info(`Cleaned ${removedCount} orphaned keys from ${locale.code}`)
          }
        }

        fileService.save(locale.code, merged)
        logger.success(`Saved ${scanResult.newKeys.size} new translations for ${locale.code}`)
        continue
      }

      // Other languages: translate
      const result = await translator.translateKeys(scanResult.newKeys, defaultLocaleName, locale.name)

      // Merge with existing
      const existing = fileService.load(locale.code)
      let merged = { ...existing, ...result.successful }

      // Clean orphaned keys if enabled
      if (options.cleanOrphaned && scanResult.orphanedKeys.size > 0) {
        const beforeCount = Object.keys(merged).length
        merged = Object.fromEntries(Object.entries(merged).filter(([k]) => scanResult.allKeys.has(k)))
        const removedCount = beforeCount - Object.keys(merged).length

        if (removedCount > 0) {
          logger.info(`Cleaned ${removedCount} orphaned keys from ${locale.code}`)
        }
      }

      fileService.save(locale.code, merged)

      // Save errors if any
      if (result.failed.length > 0) {
        const existingErrors = fileService.loadErrors()
        fileService.saveErrors([...existingErrors, ...result.failed])
        logger.warn(`${result.failed.length} translations failed for ${locale.code}`)
      }

      logger.success(`Saved ${Object.keys(result.successful).length} new translations for ${locale.code}`)
    }
  } catch (error) {
    logger.error('Translation process failed:', error)
    throw error
  }
}
