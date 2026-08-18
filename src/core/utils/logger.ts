export class Logger {
  constructor(private readonly context: string) {}

  info(message: string, ...args: unknown[]): void {
    console.log(`[${this.context}] ${message}`, ...args)
  }

  success(message: string, ...args: unknown[]): void {
    console.log(`[${this.context}] ${message}`, ...args)
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.context}] ${message}`, ...args)
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[${this.context}] ${message}`, ...args)
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.log(`[${this.context}] [debug] ${message}`, ...args)
    }
  }
}
