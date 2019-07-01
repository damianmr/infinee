/*
  Helper module to emit log messages to the console and avoid ts-lint
  warnings during development.
*/

// TODO Add sanitary check through ENV_VARIABLE that removes the messages during build time.

function emitMessage(
  type: 'error' | 'warn' | 'info' | 'log' | 'debug',
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any[]
): void {
  if (details.length > 0) {
    console[type](message, ...details);
  } else {
    console[type](message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function log(message?: any, ...details: any[]): void {
  emitMessage('log', message, details);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function error(message?: any, ...details: any[]): void {
  emitMessage('error', message, details);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function warn(message?: any, ...details: any[]): void {
  emitMessage('warn', message, details);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function info(message?: any, ...details: any[]): void {
  emitMessage('info', message, details);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debug(message?: any, ...details: any[]): void {
  emitMessage('debug', message, details);
}
