const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  redact?: string[];
}

function redactSensitiveData(data: any, fieldsToRedact: string[] = []): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitivePatterns = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'apikey',
    'api_key',
    'credential',
    'email',
    ...fieldsToRedact
  ];

  const redacted = Array.isArray(data) ? [...data] : { ...data };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    
    if (sensitivePatterns.some(pattern => lowerKey.includes(pattern))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key], fieldsToRedact);
    }
  }

  return redacted;
}

function formatMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    const redactedData = redactSensitiveData(data);
    return `${prefix} ${message} ${JSON.stringify(redactedData)}`;
  }
  
  return `${prefix} ${message}`;
}

export const logger = {
  debug: (message: string, data?: any, options?: LogOptions) => {
    if (!isProduction) {
      console.debug(formatMessage('debug', message, data));
    }
  },

  info: (message: string, data?: any, options?: LogOptions) => {
    const redactedData = options?.redact 
      ? redactSensitiveData(data, options.redact) 
      : redactSensitiveData(data);
    console.info(formatMessage('info', message, redactedData));
  },

  warn: (message: string, data?: any, options?: LogOptions) => {
    const redactedData = options?.redact 
      ? redactSensitiveData(data, options.redact) 
      : redactSensitiveData(data);
    console.warn(formatMessage('warn', message, redactedData));
  },

  error: (message: string, error?: Error | any, options?: LogOptions) => {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...error }
      : error;
    
    const redactedData = options?.redact 
      ? redactSensitiveData(errorData, options.redact) 
      : redactSensitiveData(errorData);
    
    console.error(formatMessage('error', message, redactedData));
  },
};

export default logger;
