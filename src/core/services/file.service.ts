import * as fs from 'fs'
import path from 'path'
import type { TranslationError } from '../../types'

export class TranslationFileService {
  constructor(
    private readonly projectRoot: string,
    private readonly basePath: string,
    private readonly backupPath: string | undefined,
    private readonly backupEnabled: boolean = true,
    private readonly maxBackups: number = 3,
  ) {}

  load(langCode: string): Record<string, string> {
    const filePath = this.getFilePath(langCode)
    if (!fs.existsSync(filePath)) return {}

    try {
      const file = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(file)
    } catch (error) {
      console.warn(`Error loading translations for ${langCode}:`, error)
      return {}
    }
  }

  save(langCode: string, translations: Record<string, string>): void {
    const filePath = this.getFilePath(langCode)

    if (this.backupEnabled && this.backupPath && fs.existsSync(filePath)) {
      this.createBackup(langCode)
      this.cleanOldBackups(langCode)
    }

    const dirPath = path.dirname(filePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2))
  }

  loadErrors(): TranslationError[] {
    const errorPath = this.getErrorLogPath()
    if (!fs.existsSync(errorPath)) return []

    try {
      const file = fs.readFileSync(errorPath, 'utf-8')
      return JSON.parse(file)
    } catch (error) {
      console.warn('Error loading error log:', error)
      return []
    }
  }

  saveErrors(errors: TranslationError[]): void {
    const errorPath = this.getErrorLogPath()
    const dirPath = path.dirname(errorPath)

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    fs.writeFileSync(errorPath, JSON.stringify(errors, null, 2))
  }

  private createBackup(langCode: string): void {
    if (!this.backupPath) return

    const filePath = this.getFilePath(langCode)
    const backupDir = path.join(this.projectRoot, this.backupPath)

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFilePath = path.join(backupDir, `${langCode}-${timestamp}.json`)

    fs.copyFileSync(filePath, backupFilePath)
  }

  /**
   * Clean old backups, keeping only the N most recent per language
   */
  private cleanOldBackups(langCode: string): void {
    if (!this.backupPath) return

    const backupDir = path.join(this.projectRoot, this.backupPath)

    if (!fs.existsSync(backupDir)) return

    try {
      // Get all backups for this language
      const allFiles = fs.readdirSync(backupDir)
      const langBackups = allFiles
        .filter(file => file.startsWith(`${langCode}-`) && file.endsWith('.json'))
        .map((file) => ({
          name: file,
          path: path.join(backupDir, file),
          mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime) // Sort by most recent first

      // Delete backups that exceed the limit
      if (langBackups.length > this.maxBackups) {
        const toDelete = langBackups.slice(this.maxBackups)
        toDelete.forEach((backup) => {
          fs.unlinkSync(backup.path)
          console.log(`[Backup] Deleted old backup: ${backup.name}`)
        })
      }
    } catch (error) {
      console.warn(`Error cleaning old backups for ${langCode}:`, error)
    }
  }

  private getFilePath(langCode: string): string {
    return path.join(this.projectRoot, this.basePath, `${langCode}.json`)
  }

  private getErrorLogPath(): string {
    return path.join(this.projectRoot, this.basePath, 'translation-errors.json')
  }
}
