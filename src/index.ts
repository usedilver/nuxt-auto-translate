// Main module export
export { default } from './module'
export type { ModuleOptions } from './module'

// Re-export types for consumers
export type {
  LocaleConfig,
  ProviderConfig,
  ProviderName,
  TranslationResult,
  TranslationError,
  TranslationBatchResult,
  ScanResult,
} from './types'
