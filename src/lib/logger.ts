// Basic logger implementation using console
// We can enhance this later with Winston or other logging libraries

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(message, ...args);
  },
}; 