// ============================================
// Module Options (Public API)
// ============================================

/**
 * Configuration options for the nuxt-auto-translate module
 */
export interface ModuleOptions {
  /**
   * Enable/disable auto-translate functionality
   * @default false
   */
  enabled: boolean

  /**
   * Translation provider to use
   * @default 'openai'
   */
  provider: ProviderName

  /**
   * Default locale code (source language)
   * @default 'es'
   */
  defaultLocale: string

  /**
   * List of locales to translate to
   */
  locales: LocaleConfig[]

  /**
   * Output path for translation files (relative to project root)
   * @default 'i18n/locales'
   */
  outputPath: string

  /**
   * Backup path for translation files before cleaning
   */
  backupPath?: string

  /**
   * Paths to ignore when watching for changes
   */
  ignorePaths?: string[]

  /**
   * Folders to scan for $t() calls
   * @default ['components', 'pages', 'composables', 'layouts', 'middleware', 'plugins', 'store', 'utils']
   */
  targetFolders?: string[]

  /**
   * Root-level files to scan (e.g., app.vue, error.vue)
   * @default []
   */
  rootFiles?: string[]

  /**
   * File extensions to scan
   * @default ['.vue', '.ts', '.js']
   */
  fileExtensions?: string[]

  /**
   * Enable caching (only translate new keys)
   * @default true
   */
  enableCache?: boolean

  /**
   * Remove orphaned translations (keys no longer in code)
   * @default false
   */
  cleanOrphaned?: boolean

  /**
   * Create backup before cleaning orphaned keys
   * @default true
   */
  backupBeforeClean?: boolean

  /**
   * Maximum number of backups to keep per locale
   * @default 3
   */
  maxBackups?: number

  /**
   * OpenAI provider configuration
   */
  openai?: ProviderConfig

  /**
   * Anthropic (Claude) provider configuration
   */
  anthropic?: ProviderConfig

  /**
   * Google Gemini provider configuration
   */
  gemini?: ProviderConfig

  /**
   * Groq provider configuration
   */
  groq?: ProviderConfig

  /**
   * Ollama/LM Studio provider configuration (local models)
   */
  ollama?: ProviderConfig
}

// ============================================
// Locale Configuration
// ============================================

export interface LocaleConfig {
  /**
   * Locale code (e.g., 'en', 'es', 'fr')
   */
  code: string

  /**
   * Human-readable name (e.g., 'English', 'Español')
   */
  name: string

  /**
   * Optional output filename (defaults to `${code}.json`)
   */
  file?: string
}

// ============================================
// Provider Configuration
// ============================================

export type ProviderName = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama'

export interface ProviderConfig {
  /**
   * API key for the provider
   * Falls back to environment variable if not provided
   */
  apiKey?: string

  /**
   * Model to use for translation
   * Each provider has a sensible default
   */
  model?: string

  /**
   * Base URL for the API (useful for proxies or local models)
   */
  baseUrl?: string
}

// ============================================
// Internal Types
// ============================================

/**
 * Result type (Rust-style error handling)
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

/**
 * Result of a single translation
 */
export type TranslationResult = Result<{ key: string; value: string }, { key: string; error: string }>

/**
 * Error details for failed translations
 */
export interface TranslationError {
  key: string
  error: string
  timestamp?: string
}

/**
 * Result of a batch translation operation
 */
export interface TranslationBatchResult {
  successful: Record<string, string>
  failed: TranslationError[]
}

/**
 * Result of scanning source code for translation keys
 */
export interface ScanResult {
  /** New keys found that don't exist in current translations */
  newKeys: Set<string>
  /** All keys found in source code */
  allKeys: Set<string>
  /** Keys that exist in translations but not in source code */
  orphanedKeys: Set<string>
  /** Map of key to list of file locations where it's used */
  keyLocations: Map<string, string[]>
}

/**
 * Internal configuration (resolved from ModuleOptions + env vars)
 */
export interface ResolvedConfig {
  enabled: boolean
  provider: ProviderName
  defaultLocale: string
  defaultLocaleName: string
  locales: LocaleConfig[]
  projectRoot: string
  outputPath: string
  backupPath?: string
  ignorePaths: string[]
  targetFolders: string[]
  rootFiles: string[]
  fileExtensions: string[]
  enableCache: boolean
  cleanOrphaned: boolean
  backupBeforeClean: boolean
  maxBackups: number
  openai: ProviderConfig
  anthropic: ProviderConfig
  gemini: ProviderConfig
  groq: ProviderConfig
  ollama: ProviderConfig
}
