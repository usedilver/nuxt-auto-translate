import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveOptions, DEFAULT_OPTIONS } from '../src/core/resolve-options'

describe('resolveOptions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('applies defaults when nothing is provided', () => {
    const options = resolveOptions({})

    expect(options.provider).toBe('openai')
    expect(options.watch).toBe(false)
    expect(options.enableCache).toBe(true)
    expect(options.fileExtensions).toEqual(['.vue', '.ts', '.js'])
    expect(options.defaultLocale).toBe('es')
    expect(options.locales).toEqual([])
  })

  it('auto-detects defaultLocale and target locales from i18n, excluding the source', () => {
    const options = resolveOptions({}, {
      defaultLocale: 'es',
      locales: [
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'English' },
      ],
    })

    expect(options.defaultLocale).toBe('es')
    expect(options.locales).toEqual([{ code: 'en', name: 'English', file: undefined }])
  })

  it('supports string-form i18n locales', () => {
    const options = resolveOptions({}, {
      defaultLocale: 'es',
      locales: ['es', 'en', 'pt'],
    })

    expect(options.locales).toEqual([
      { code: 'en', name: 'en' },
      { code: 'pt', name: 'pt' },
    ])
  })

  it('lets explicit options win over i18n auto-detection', () => {
    const options = resolveOptions(
      { defaultLocale: 'en', locales: [{ code: 'fr', name: 'Français' }] },
      { defaultLocale: 'es', locales: [{ code: 'es', name: 'Español' }, { code: 'en', name: 'English' }] },
    )

    expect(options.defaultLocale).toBe('en')
    expect(options.locales).toEqual([{ code: 'fr', name: 'Français' }])
  })

  it('does not mutate the shared DEFAULT_OPTIONS.locales array', () => {
    resolveOptions({}, { defaultLocale: 'es', locales: ['es', 'en'] })

    expect(DEFAULT_OPTIONS.locales).toEqual([])
  })

  it('falls back to defaultLocale "es" when no i18n config is present', () => {
    const options = resolveOptions({ provider: 'anthropic' })

    expect(options.provider).toBe('anthropic')
    expect(options.defaultLocale).toBe('es')
  })
})
