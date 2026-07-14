import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
      : undefined,
  base: { service: 'dosson-architecture-visualizer-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createChildLogger(context: string) {
  return logger.child({ context });
}
