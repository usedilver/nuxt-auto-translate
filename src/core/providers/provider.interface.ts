import type { TranslationResult } from '../../types'

/**
 * Interface for translation providers
 * All providers must implement this interface
 */
export interface TranslationProvider {
  /** Provider name for logging and identification */
  readonly name: string

  /** Whether the provider supports batch translation */
  readonly supportsBatching: boolean

  /**
   * Translate a single text
   * @param text - Text to translate
   * @param sourceLang - Source language name (e.g., "Español")
   * @param targetLang - Target language name (e.g., "English")
   */
  translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>

  /**
   * Translate multiple texts in a single request (optional)
   * @param texts - Array of texts to translate
   * @param sourceLang - Source language name
   * @param targetLang - Target language name
   */
  translateBatch?(texts: string[], sourceLang: string, targetLang: string): Promise<TranslationResult[]>
}
