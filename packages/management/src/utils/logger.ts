/* eslint-disable no-console */
const isDev = import.meta.env.DEV

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString().slice(11, 19)
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
}

export const logger = {
  debug(context: string, message: string, ...args: unknown[]) {
    if (isDev) {
      console.debug(formatMessage('debug', context, message), ...args)
    }
  },

  info(context: string, message: string, ...args: unknown[]) {
    if (isDev) {
      console.info(formatMessage('info', context, message), ...args)
    }
  },

  warn(context: string, message: string, ...args: unknown[]) {
    console.warn(formatMessage('warn', context, message), ...args)
  },

  error(context: string, message: string, ...args: unknown[]) {
    console.error(formatMessage('error', context, message), ...args)
  },
}
