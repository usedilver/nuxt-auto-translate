import type { TranslationProvider } from '../providers/provider.interface'
import type { TranslationBatchResult, TranslationError } from '../../types'
import { TranslationValidator } from '../utils/validators'
import { Logger } from '../utils/logger'

export class TranslatorService {
  private readonly logger = new Logger('TranslatorService')
  private readonly validator = new TranslationValidator()
  private readonly concurrencyLimit = 5
  private readonly batchThreshold = 20 // Use batching only if we have 20+ keys
  private readonly batchChunkSize = 30 // Process 30 keys per batch call

  constructor(private readonly provider: TranslationProvider) {}

  async translateKeys(keys: Set<string>, sourceLang: string, targetLang: string): Promise<TranslationBatchResult> {
    const keysArray = Array.from(keys)

    if (keysArray.length === 0) {
      return { successful: {}, failed: [] }
    }

    this.logger.info(`Translating ${keysArray.length} keys from ${sourceLang} to ${targetLang}`)

    // Use batching if provider supports it and we have enough keys
    if (this.provider.supportsBatching && keysArray.length >= this.batchThreshold) {
      this.logger.info(`Using batch mode (${this.batchChunkSize} keys per batch)`)
      return this.translateWithBatching(keysArray, sourceLang, targetLang)
    }

    // Individual translation with rate limiting
    this.logger.info(`Using individual mode (${this.concurrencyLimit} concurrent requests)`)
    return this.translateIndividually(keysArray, sourceLang, targetLang)
  }

  private async translateIndividually(
    keys: string[],
    sourceLang: string,
    targetLang: string,
  ): Promise<TranslationBatchResult> {
    const successful: Record<string, string> = {}
    const failed: TranslationError[] = []

    // Process in batches to implement rate limiting
    const batchSize = this.concurrencyLimit
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const promises = batch.map(key => this.provider.translate(key, sourceLang, targetLang))

      const results = await Promise.allSettled(promises)

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            const { key, value } = result.value.data

            // Validate translation
            if (this.validator.validate(key, value)) {
              successful[key] = value
              this.logger.debug(`Translated: ${key.substring(0, 40)}...`)
            } else {
              failed.push({
                key,
                error: 'Validation failed: variables or HTML mismatch',
                timestamp: new Date().toISOString(),
              })
              this.logger.warn(`Validation failed for: ${key.substring(0, 40)}...`)
            }
          } else {
            failed.push({
              ...result.value.error,
              timestamp: new Date().toISOString(),
            })
            this.logger.warn(`Failed: ${result.value.error.key.substring(0, 40)}...: ${result.value.error.error}`)
          }
        } else {
          this.logger.error('Promise rejected:', result.reason)
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < keys.length) {
        await this.delay(100)
      }
    }

    this.logger.success(`Completed: ${Object.keys(successful).length} successful, ${failed.length} failed`)

    return { successful, failed }
  }

  private async translateWithBatching(
    keys: string[],
    sourceLang: string,
    targetLang: string,
  ): Promise<TranslationBatchResult> {
    if (!this.provider.translateBatch) {
      return this.translateIndividually(keys, sourceLang, targetLang)
    }

    const successful: Record<string, string> = {}
    const failed: TranslationError[] = []

    const totalChunks = Math.ceil(keys.length / this.batchChunkSize)
    let currentChunk = 0

    for (let i = 0; i < keys.length; i += this.batchChunkSize) {
      currentChunk++
      const chunk = keys.slice(i, i + this.batchChunkSize)

      this.logger.info(`Processing batch ${currentChunk}/${totalChunks} (${chunk.length} keys)`)

      try {
        const results = await this.provider.translateBatch(chunk, sourceLang, targetLang)

        for (const result of results) {
          if (result.success) {
            const { key, value } = result.data

            if (this.validator.validate(key, value)) {
              successful[key] = value
              this.logger.debug(`Translated: ${key.substring(0, 40)}...`)
            } else {
              failed.push({
                key,
                error: 'Validation failed: variables or HTML mismatch',
                timestamp: new Date().toISOString(),
              })
              this.logger.warn(`Validation failed: ${key.substring(0, 40)}...`)
            }
          } else {
            failed.push({
              ...result.error,
              timestamp: new Date().toISOString(),
            })
            this.logger.warn(`Failed: ${result.error.key.substring(0, 40)}...: ${result.error.error}`)
          }
        }

        this.logger.success(
          `Batch ${currentChunk}/${totalChunks} done: ${Object.keys(successful).length}/${keys.length} total successful`,
        )
      } catch (error) {
        this.logger.error(`Batch ${currentChunk}/${totalChunks} failed:`, error)
        chunk.forEach((key) => {
          failed.push({
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          })
        })
      }

      // Delay between chunks (more aggressive to avoid rate limits)
      if (i + this.batchChunkSize < keys.length) {
        this.logger.debug('Waiting 1s before next batch...')
        await this.delay(1000)
      }
    }

    this.logger.success(
      `Batch translation completed: ${Object.keys(successful).length} successful, ${failed.length} failed`,
    )

    return { successful, failed }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
