import type { TranslationProvider } from './provider.interface'
import type { ProviderName, ProviderConfig } from '../../types'

export type { TranslationProvider } from './provider.interface'

type ProviderFactory = () => TranslationProvider

const providerRegistry = new Map<ProviderName, ProviderFactory>()

export function registerProvider(name: ProviderName, factory: ProviderFactory) {
  providerRegistry.set(name, factory)
}

export function getProvider(name: ProviderName): TranslationProvider {
  const factory = providerRegistry.get(name)
  if (!factory) {
    throw new Error(
      `Provider "${name}" is not configured or missing credentials. Check your environment variables and the selected provider.`,
    )
  }
  return factory()
}

interface ProvidersConfig {
  openai?: ProviderConfig
  anthropic?: ProviderConfig
  gemini?: ProviderConfig
  groq?: ProviderConfig
  ollama?: ProviderConfig
}

/**
 * Initialize only the active provider dynamically to avoid loading unnecessary packages
 * or errors if the SDK of an unused provider is not installed.
 */
export async function initializeProviders(config: ProvidersConfig, activeProvider: ProviderName) {
  // OpenAI
  if (activeProvider === 'openai' && config.openai?.apiKey) {
    const { OpenAIProvider } = await import('./openai.provider')
    registerProvider('openai', () => new OpenAIProvider(config.openai!.apiKey!, config.openai!.model))
  }

  // Anthropic (Claude)
  if (activeProvider === 'anthropic' && config.anthropic?.apiKey) {
    const { AnthropicProvider } = await import('./anthropic.provider')
    registerProvider('anthropic', () => new AnthropicProvider(config.anthropic!.apiKey!, config.anthropic!.model))
  }

  // Google Gemini
  if (activeProvider === 'gemini' && config.gemini?.apiKey) {
    const { GeminiProvider } = await import('./gemini.provider')
    registerProvider('gemini', () => new GeminiProvider(config.gemini!.apiKey!, config.gemini!.model))
  }

  // Groq
  if (activeProvider === 'groq' && config.groq?.apiKey) {
    const { GroqProvider } = await import('./groq.provider')
    registerProvider('groq', () => new GroqProvider(config.groq!.apiKey!, config.groq!.model, config.groq!.baseUrl))
  }

  // Ollama / LM Studio (local) - No API key required
  if (activeProvider === 'ollama') {
    const { OllamaProvider } = await import('./ollama.provider')
    registerProvider('ollama', () => new OllamaProvider(config.ollama?.model, config.ollama?.baseUrl))
  }
}
