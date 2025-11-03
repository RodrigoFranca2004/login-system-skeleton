/**
 * Custom error class for "Resource Not Found" scenarios.
 * This should be used when an operation targets an entity
 * that does not exist in the database.
 */
export class ResourceNotFoundError extends Error {
  constructor(message = 'Resource not found.') {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Custom error class for "Business Rule Violation" scenarios.
 * This should be used when an operation violates a specific
 * application-level business rule.
 */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}