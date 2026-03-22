export class TranslationValidator {
  validate(original: string, translated: string): boolean {
    return this.validateVariables(original, translated) && this.validateHTML(original, translated)
  }

  private validateVariables(original: string, translated: string): boolean {
    const originalVars = this.extractVariables(original)
    const translatedVars = this.extractVariables(translated)

    if (originalVars.length !== translatedVars.length) {
      return false
    }

    return originalVars.every(v => translatedVars.includes(v))
  }

  private validateHTML(original: string, translated: string): boolean {
    const originalTags = this.extractHTMLTags(original)
    const translatedTags = this.extractHTMLTags(translated)

    if (originalTags.length !== translatedTags.length) {
      return false
    }

    return originalTags.every((tag, index) => tag === translatedTags[index])
  }

  private extractVariables(text: string): string[] {
    const matches = text.match(/\{(\w+)\}/g)
    return matches || []
  }

  private extractHTMLTags(text: string): string[] {
    const matches = text.match(/<\/?[a-z][^>]*>/gi)
    return matches || []
  }
}
