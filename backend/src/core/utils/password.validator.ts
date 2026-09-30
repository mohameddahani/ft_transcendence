// * User Password Validation

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import PasswordValidator from 'password-validator';

// * Get object from PasswordValidator class
export const passwordSchema = new PasswordValidator();

// * set validation of password
passwordSchema
  // Minimum length 8
  .is()
  .min(8)
  // Maximum length 64
  .is()
  .max(64)
  // Must have uppercase letters
  .has()
  .uppercase()
  // Must have lowercase letters
  .has()
  .lowercase()
  // Must have digits
  .has()
  .digits()
  // Must have symbols (@#...)
  .has()
  .symbols()
  // Should not have spaces
  .has()
  .not()
  .spaces();

/**
 * * Custom validator for password strength rules.
 *
 * * This decorator registers the class as a custom validation constraint
 * * using class-validator.
 *
 * @ValidatorConstraint options:
 * * - name: identifier used internally by class-validator
 * * - async: defines whether validation is synchronous (false) or asynchronous (true)
 * *            - false → no DB/API calls (fast validation)
 * *            - true  → supports async operations (e.g. database checks)
 *
 * * ValidatorConstraintInterface:
 * * This interface enforces the structure of a custom validator by requiring:
 * * - validate(): logic that determines if the value is valid
 * * - defaultMessage(): error message returned when validation fails
 */
@ValidatorConstraint({ name: 'passwordSchema', async: false })
export class IsValidPassword implements ValidatorConstraintInterface {
  /**
   * * Validates the password against the predefined schema rules.
   *
   * @param value - The password string to validate
   * @returns true if password is valid, false otherwise
   */
  validate(value: string): boolean {
    return passwordSchema.validate(value) as boolean;
  }

  // * Default error message returned when validation fails.
  defaultMessage(): string {
    return 'Password must be 8–64 characters long, include uppercase, lowercase, number, symbol, and contain no spaces';
  }
}
