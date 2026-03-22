import type { TranslationProvider } from './provider.interface'
import type { TranslationResult } from '../../types'

/**
 * Ollama Provider - Local LLM inference
 * Compatible with Ollama and LM Studio (both use OpenAI-compatible API)
 *
 * Ollama default: http://localhost:11434/v1
 * LM Studio default: http://localhost:1234/v1
 */
export class OllamaProvider implements TranslationProvider {
  readonly name = 'ollama'
  readonly supportsBatching = true

  private client: any

  constructor(
    private readonly model: string = 'llama3.2',
    private readonly baseURL: string = 'http://localhost:11434/v1',
  ) {}

  private async getClient() {
    if (!this.client) {
      const OpenAI = (await import('openai')).default
      // Ollama/LM Studio don't require API key, but SDK needs one
      this.client = new OpenAI({
        apiKey: 'ollama', // Dummy value, Ollama/LM Studio ignores it
        baseURL: this.baseURL,
      })
    }
    return this.client
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    try {
      const client = await this.getClient()
      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: `Traduce este texto de ${sourceLang} a ${targetLang}. Solo responde con la traducción, sin explicaciones. Mantén HTML intacto y no traduzcas variables entre {llaves}.\n\nTexto: ${text}`,
          },
        ],
        temperature: 0,
        max_tokens: 256,
      })

      const translatedText = response.choices[0].message?.content?.trim()

      if (!translatedText) {
        return {
          success: false,
          error: {
            key: text,
            error: 'Empty response from Ollama',
          },
        }
      }

      return {
        success: true,
        data: {
          key: text,
          value: translatedText,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          key: text,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  async translateBatch(texts: string[], sourceLang: string, targetLang: string): Promise<TranslationResult[]> {
    try {
      const client = await this.getClient()
      const inputMap = Object.fromEntries(texts.map((text, idx) => [`key_${idx}`, text]))

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: `Eres un traductor profesional de ${sourceLang} a ${targetLang}.

INSTRUCCIONES CRÍTICAS:
1. Traduce SOLO el contenido, no expliques
2. Mantén EXACTAMENTE las etiquetas HTML como están (no traduzcas nombres de etiquetas)
3. NO traduzcas variables entre {llaves} - déjalas exactamente igual
4. Mantén signos de puntuación solo si existen en el original
5. Responde ÚNICAMENTE en formato JSON válido

FORMATO DE RESPUESTA:
Recibirás un objeto JSON con claves "key_0", "key_1", etc.
Debes responder con el mismo formato pero con los valores traducidos.

${JSON.stringify(inputMap, null, 2)}`,
          },
        ],
        temperature: 0,
      })

      const content = response.choices[0].message?.content?.trim()

      if (!content) {
        console.warn('[Ollama] Empty batch response, falling back to individual translations')
        return this.fallbackToIndividual(texts, sourceLang, targetLang)
      }

      let translations: Record<string, string>
      try {
        translations = JSON.parse(content) as Record<string, string>
      } catch {
        console.warn('[Ollama] Invalid JSON in batch response, falling back to individual translations')
        return this.fallbackToIndividual(texts, sourceLang, targetLang)
      }

      return texts.map((text, idx) => {
        const key = `key_${idx}`
        const value = translations[key]

        if (value && typeof value === 'string') {
          return {
            success: true,
            data: { key: text, value },
          }
        } else {
          return {
            success: false,
            error: {
              key: text,
              error: 'Translation not found in batch response',
            },
          }
        }
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.warn('[Ollama] Connection refused - make sure Ollama/LM Studio is running')
      }

      console.warn('[Ollama] Batch translation failed, falling back to individual translations')
      return this.fallbackToIndividual(texts, sourceLang, targetLang)
    }
  }

  private async fallbackToIndividual(
    texts: string[],
    sourceLang: string,
    targetLang: string,
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = []

    for (const text of texts) {
      const result = await this.translate(text, sourceLang, targetLang)
      results.push(result)
      // Small delay to avoid overwhelming local server
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return results
  }
}
