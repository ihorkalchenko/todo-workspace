/**
 * A regular expression that matches email
 *
 * valid: test@test.com, test+1@test.com
 * invalid: test, test@test..com
 */

export const EMAIL_REGEXP = new RegExp(
  '^[a-zA-Z0-9_-]+(?:[.+][a-zA-Z0-9_-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$',
);

/**
 * A regular expression that matches a strong password.
 *
 * It requires:
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one special character (!@#$%^&*()+=._-)
 * - Length between 7 and 16 characters
 *
 * valid: Pass123!, Strong_P4ss
 * invalid: password, PASS123, 1234567, Pass!
 */
export const PASSWORD_REGEXP = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()+=._\-])[A-Za-z\d!@#$%^&*()+=._\-]{7,16}$/,
);

