import * as fs from 'fs'
import path from 'path'
import type { ScanResult } from '../../types'

export class ScannerService {
  // Regex to match $t("..."), $t('...'), or $t(`...`)
  private readonly regex = /\$t\(\s*(?:"((?:[^"\\]|\\.)*?)"|'((?:[^'\\]|\\.)*?)'|`((?:[^`]|\\.)*?)`)[^)]*\)/g

  constructor(
    private readonly projectRoot: string,
    private readonly targetFolders: string[],
    private readonly fileExtensions: string[],
    private readonly rootFiles: string[] = [],
  ) {}

  scan(existingKeys: Set<string>): ScanResult {
    const foundKeys = new Set<string>()
    const keyLocations = new Map<string, string[]>()

    // Scan target folders
    for (const folder of this.targetFolders) {
      const folderPath = path.join(this.projectRoot, folder)
      if (fs.existsSync(folderPath)) {
        this.scanDirectory(folderPath, foundKeys, keyLocations)
      }
    }

    // Scan root files (e.g., app.vue, error.vue)
    for (const rootFile of this.rootFiles) {
      const filePath = path.join(this.projectRoot, rootFile)
      if (fs.existsSync(filePath)) {
        this.scanFile(filePath, foundKeys, keyLocations)
      }
    }

    return {
      newKeys: this.difference(foundKeys, existingKeys),
      allKeys: foundKeys,
      orphanedKeys: this.difference(existingKeys, foundKeys),
      keyLocations,
    }
  }

  private scanDirectory(directoryPath: string, foundKeys: Set<string>, keyLocations: Map<string, string[]>): void {
    const files = fs.readdirSync(directoryPath)

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file)
      const stat = fs.statSync(filePath)

      if (stat.isFile() && this.fileExtensions.includes(path.extname(file))) {
        this.scanFile(filePath, foundKeys, keyLocations)
      } else if (stat.isDirectory()) {
        this.scanDirectory(filePath, foundKeys, keyLocations)
      }
    })
  }

  private scanFile(filePath: string, foundKeys: Set<string>, keyLocations: Map<string, string[]>): void {
    const content = fs.readFileSync(filePath, 'utf-8')
    const matches = [...content.matchAll(this.regex)]

    matches.forEach((match) => {
      const key = this.findContent(match)
      if (key) {
        foundKeys.add(key)

        const locations = keyLocations.get(key) || []
        locations.push(filePath)
        keyLocations.set(key, locations)
      }
    })
  }

  private findContent(matches: RegExpMatchArray): string | null {
    for (let i = 1; i < matches.length; i++) {
      if (matches[i]?.trim()) {
        return matches[i]
      }
    }
    return null
  }

  private difference(a: Set<string>, b: Set<string>): Set<string> {
    return new Set([...a].filter(x => !b.has(x)))
  }
}
