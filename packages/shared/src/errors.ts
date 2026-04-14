type ErrorConstructorWithCapture = ErrorConstructor & {
  captureStackTrace?(error: Error, constructorOpt?: new (...args: never[]) => Error): void;
};

export class ApplicationError extends Error {
  public code: string;
  public details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    const Base = Error as ErrorConstructorWithCapture;
    if (typeof Base.captureStackTrace === 'function') {
      Base.captureStackTrace(this, this.constructor as new (...args: never[]) => Error);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export class PluginExecutionError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'PLUGIN_EXECUTION_ERROR', details);
  }
}

export class SecurityPolicyError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'SECURITY_POLICY_ERROR', details);
  }
}

export class ManifestValidationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'MANIFEST_VALIDATION_ERROR', details);
  }
}
