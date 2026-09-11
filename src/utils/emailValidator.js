// ==============================================================================
// RESIBOSS EMAIL VALIDATION UTILITY
// ==============================================================================
// Purpose: Strictly validates email format, checks for common typos (e.g. gamil.com),
//          and blocks fake or malformed email addresses before account creation.
// ==============================================================================

const COMMON_TYPOS = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.c': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
};

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'yopmail.fr',
  'dispostable.com',
  'fakeinbox.com',
  'trashmail.com',
  'temp-mail.org',
  'throwawaymail.com',
]);

/**
 * Validates an email address thoroughly.
 * @param {string} email - The email address to test.
 * @param {string} lang - 'fil' | 'en'
 * @returns {{ isValid: boolean, error: string | null, suggestion: string | null }}
 */
export const validateEmailAddress = (email, lang = 'fil') => {
  const isFil = lang === 'fil';

  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: isFil ? 'Pakilagay ang iyong email address.' : 'Please enter your email address.',
      suggestion: null,
    };
  }

  const cleaned = email.trim().toLowerCase();

  // Basic length limits
  if (cleaned.length < 6 || cleaned.length > 254) {
    return {
      isValid: false,
      error: isFil
        ? 'Masyadong maikli o mahaba ang email address.'
        : 'Email address is too short or too long.',
      suggestion: null,
    };
  }

  // Check for spaces or forbidden characters
  if (/\s/.test(cleaned)) {
    return {
      isValid: false,
      error: isFil
        ? 'Bawal ang space sa email address. Pakitanggal ang mga puwang.'
        : 'Spaces are not allowed in email addresses.',
      suggestion: null,
    };
  }

  // Check exactly one @ symbol
  const atParts = cleaned.split('@');
  if (atParts.length !== 2) {
    return {
      isValid: false,
      error: isFil
        ? 'Kailangang may isang "@" symbol ang email (hal. pangalan@gmail.com).'
        : 'Email must contain exactly one "@" symbol (e.g. name@gmail.com).',
      suggestion: null,
    };
  }

  const [localPart, domainPart] = atParts;

  // Local part validation
  if (!localPart || localPart.length < 2) {
    return {
      isValid: false,
      error: isFil
        ? 'Masyadong maikli ang pangalan bago ang "@" symbol.'
        : 'The username part before "@" is too short.',
      suggestion: null,
    };
  }

  // No leading, trailing, or consecutive dots
  if (
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..') ||
    domainPart.startsWith('.') ||
    domainPart.endsWith('.') ||
    domainPart.includes('..')
  ) {
    return {
      isValid: false,
      error: isFil
        ? 'Hindi wastong paggamit ng tuldok (.) sa email address.'
        : 'Invalid use of dots (.) in email address.',
      suggestion: null,
    };
  }

  // Domain part validation
  if (!domainPart || !domainPart.includes('.')) {
    return {
      isValid: false,
      error: isFil
        ? 'Kailangang may valid domain ang email (hal. @gmail.com o @yahoo.com).'
        : 'Email domain is missing or incomplete (e.g. @gmail.com).',
      suggestion: null,
    };
  }

  // TLD validation (must have at least 2 letters at the end)
  const domainPieces = domainPart.split('.');
  const tld = domainPieces[domainPieces.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      error: isFil
        ? 'Maling domain extension (hal. dapat may ".com", ".net", ".ph").'
        : 'Invalid domain extension (e.g. must end in ".com", ".ph", etc.).',
      suggestion: null,
    };
  }

  // Common typo check
  if (COMMON_TYPOS[domainPart]) {
    const suggestedDomain = COMMON_TYPOS[domainPart];
    const suggestedEmail = `${localPart}@${suggestedDomain}`;
    return {
      isValid: false,
      error: isFil
        ? `Mukhang may typo ang email domain ("@${domainPart}"). Baka ang ibig mong sabihin ay "${suggestedEmail}"?`
        : `Possible typo in email domain ("@${domainPart}"). Did you mean "${suggestedEmail}"?`,
      suggestion: suggestedEmail,
    };
  }

  // Check for disposable domains
  if (DISPOSABLE_DOMAINS.has(domainPart)) {
    return {
      isValid: false,
      error: isFil
        ? 'Hindi pinapayagan ang disposable/temporary email. Pakigamit ang inyong totoong Gmail o email address.'
        : 'Temporary/disposable email addresses are not allowed. Please use a valid email address.',
      suggestion: null,
    };
  }

  // RFC compliant standard email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleaned)) {
    return {
      isValid: false,
      error: isFil
        ? 'Hindi wastong email format. Pakisuri kung may maling letra o simbolo.'
        : 'Invalid email format. Please check for typos or unsupported symbols.',
      suggestion: null,
    };
  }

  return {
    isValid: true,
    error: null,
    suggestion: null,
  };
};
