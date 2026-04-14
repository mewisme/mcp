export class ApplicationError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

export class PluginExecutionError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'PLUGIN_EXECUTION_ERROR', details);
  }
}

export class SecurityPolicyError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_POLICY_ERROR', details);
  }
}

export class ManifestValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'MANIFEST_VALIDATION_ERROR', details);
  }
}
