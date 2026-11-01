const configuredJwtSecret = process.env.JWT_SECRET;

if (!configuredJwtSecret || configuredJwtSecret.trim().length < 32) {
  throw new Error(
    "JWT_SECRET must be set to a secret of at least 32 characters. Configure it in backend/.env."
  );
}

// Export a definite string so jwt.sign/jwt.verify do not receive string | undefined.
export const JWT_SECRET: string = configuredJwtSecret;
