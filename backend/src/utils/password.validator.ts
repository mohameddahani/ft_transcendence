// * User Password Validation

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import PasswordValidator from "password-validator";

export const passwordSchema = new PasswordValidator();

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

@ValidatorConstraint({ name: "passwordSchema", async: false })
export class IsValidPassword implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return passwordSchema.validate(value) as boolean;
  }

  defaultMessage(): string {
    return "Password must be 8-64 chars, include uppercase, lowercase, number, symbol, and no spaces";
  }
}
