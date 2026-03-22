import type { TranslationProvider } from './provider.interface'
import type { TranslationResult } from '../../types'

export class GroqProvider implements TranslationProvider {
  readonly name = 'groq'
  readonly supportsBatching = true

  private client: any

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'llama-3.3-70b-versatile',
    private readonly baseURL: string = 'https://api.groq.com/openai/v1',
  ) {}

  private async getClient() {
    if (!this.client) {
      const OpenAI = (await import('openai')).default
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      })
    }
    return this.client
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: {
          key: text,
          error: 'No API key provided for Groq',
        },
      }
    }

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
            error: 'Empty response from Groq',
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
    if (!this.apiKey) {
      return texts.map(text => ({
        success: false,
        error: {
          key: text,
          error: 'No API key provided for Groq',
        },
      }))
    }

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
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0].message?.content?.trim()

      if (!content) {
        console.warn('[Groq] Empty batch response, falling back to individual translations')
        return this.fallbackToIndividual(texts, sourceLang, targetLang)
      }

      let translations: Record<string, string>
      try {
        translations = JSON.parse(content) as Record<string, string>
      } catch {
        console.warn('[Groq] Invalid JSON in batch response, falling back to individual translations')
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
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('[Groq] Rate limit hit during batch translation')
      }

      console.warn('[Groq] Batch translation failed, falling back to individual translations')
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
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }
}
