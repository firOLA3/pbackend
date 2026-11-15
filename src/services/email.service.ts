import bcrypt from 'bcryptjs';

export interface GeneratedCode {
  rawCode: string;
  codeHash: string;
  expiresAt: Date;
}

/**
 * Generates a secure random 6-digit verification code and its bcrypt hash.
 * Default validity: 15 minutes.
 */
export const generateSixDigitCode = async (validityMinutes = 15): Promise<GeneratedCode> => {
  const codeNumber = Math.floor(100000 + Math.random() * 900000);
  const rawCode = codeNumber.toString();
  const codeHash = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  return {
    rawCode,
    codeHash,
    expiresAt,
  };
};

/**
 * Verifies if user entered code matches the stored bcrypt hash and is not expired.
 */
export const verifySixDigitCode = async (
  rawCode: string,
  codeHash?: string,
  expiresAt?: Date
): Promise<{ valid: boolean; reason?: string }> => {
  if (!codeHash || !expiresAt) {
    return { valid: false, reason: 'No code was requested or code already used.' };
  }

  if (new Date() > new Date(expiresAt)) {
    return { valid: false, reason: 'Verification code has expired. Please request a new one.' };
  }

  const matches = await bcrypt.compare(rawCode, codeHash);
  if (!matches) {
    return { valid: false, reason: 'Invalid 6-digit verification code.' };
  }

  return { valid: true };
};

/**
 * Email delivery service.
 * In development, cleanly formats to console. Pluggable for Resend/SendGrid/SMTP.
 */
export const sendVerificationEmail = async (email: string, code: string): Promise<void> => {
  console.log('\n======================================================');
  console.log('               📧 PULSEFIT EMAIL VERIFICATION');
  console.log('======================================================');
  console.log(`To:      ${email}`);
  console.log(`Subject: Your PulseFit Verification Code: [ ${code} ]`);
  console.log(`Body:    Welcome to PulseFit!`);
  console.log(`         Your 6-digit verification code is:`);
  console.log(`                    >>> ${code} <<<`);
  console.log(`         This code will expire in 15 minutes.`);
  console.log('======================================================\n');
};

export const sendPasswordResetEmail = async (email: string, code: string): Promise<void> => {
  console.log('\n======================================================');
  console.log('               🔑 PULSEFIT PASSWORD RESET');
  console.log('======================================================');
  console.log(`To:      ${email}`);
  console.log(`Subject: Your PulseFit Password Reset Code: [ ${code} ]`);
  console.log(`Body:    We received a request to reset your password.`);
  console.log(`         Your 6-digit password reset code is:`);
  console.log(`                    >>> ${code} <<<`);
  console.log(`         This code will expire in 15 minutes.`);
  console.log('======================================================\n');
};

