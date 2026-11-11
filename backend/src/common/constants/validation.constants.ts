export const NAME_RULES = {
  minLength: 3,
  maxLength: 50,
} as const;

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/,
  letterPattern: /[A-Za-z]/,
  numberPattern: /\d/,
  specialCharacterPattern: /[^A-Za-z0-9]/,
} as const;

export const EMAIL_MESSAGES = {
  invalid: 'Please enter a valid email address',
} as const;

export const NAME_MESSAGES = {
  length: `Name must be between ${NAME_RULES.minLength} and ${NAME_RULES.maxLength} characters`,
} as const;

export const PASSWORD_MESSAGES = {
  required: 'Password is required',
  minLength: `Password must be at least ${PASSWORD_RULES.minLength} characters`,
  maxLength: `Password must be at most ${PASSWORD_RULES.maxLength} characters`,
  letter: 'Password must contain at least one letter',
  number: 'Password must contain at least one number',
  specialCharacter: 'Password must contain at least one special character',
  invalid: 'Password must not contain line breaks',
} as const;
