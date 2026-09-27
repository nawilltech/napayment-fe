/**
 * Every client-side validation message, defined once. Schemas and forms in
 * all apps reference these keys instead of writing the copy inline; errors
 * the backend returns carry their own message (see @napayment/api-client's
 * error catalogue).
 */
export const VALIDATION_MESSAGES = {
  required: "Required",
  emailInvalid: "Enter a valid email",
  phoneInvalid: "Enter a valid phone number",
  passwordTooShort: "Must be at least 8 characters",
  passwordNeedsLowercase: "Must include a lowercase letter",
  passwordNeedsUppercase: "Must include an uppercase letter",
  passwordNeedsDigit: "Must include a digit",
  passwordNeedsSpecial: "Must include a special character",
  passwordsMismatch: "Passwords don't match",
  resetCodeInvalid: "Enter the 6-digit code",
  cacNumberFormat: "Format like RC1234567",
  countryRequired: "Select a country",
  stateRequired: "Select a state",
  bvnInvalid: "BVN must be 11 digits",
  ninInvalid: "NIN must be 11 digits",
  ownerIdRequired: "Provide either a BVN or an NIN",
  currentPinRequired: "Enter your current 4-digit PIN",
  pinInvalid: "PIN must be exactly 4 digits",
  pinsMismatch: "PINs don't match",
  transactionPinRequired: "Enter your 4-digit transaction PIN",
  cidrInvalid: "Enter a valid IP address or CIDR range, e.g. 192.168.1.0/24",
  urlInvalid: "Enter a valid URL",
  recipientRequired: "Enter an account number or phone number",
  amountRequired: "Enter an amount",
  amountInvalid: "Enter a valid amount",
  amountInvalidOrEmpty: "Enter a valid amount, or leave it empty",
  amountInvalidOrEmptyToWithdrawAll: "Enter a valid amount, or leave it empty to withdraw everything",
  amountNotPositive: "Amount must be greater than zero",
  amountExceedsBalance: "That is more than your available balance",
  bankRequired: "Choose the bank",
  accountNumberInvalid: "Account number is 10 digits",
  processorNameRequired: "Name the processor",
  kycRejectReasonRequired: "Give a reason - the business sees it",
  tooLong: (max: number) => `Keep it under ${max} characters`,
} as const;
