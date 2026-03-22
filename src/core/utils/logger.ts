export class Logger {
  constructor(private readonly context: string) {}

  info(message: string, ...args: any[]): void {
    console.log(`[${this.context}] ${message}`, ...args)
  }

  success(message: string, ...args: any[]): void {
    console.log(`[${this.context}] ${message}`, ...args)
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] ${message}`, ...args)
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.context}] ${message}`, ...args)
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG) {
      console.log(`[${this.context}] [debug] ${message}`, ...args)
    }
  }
}
