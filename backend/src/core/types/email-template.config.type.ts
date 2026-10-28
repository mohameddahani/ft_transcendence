export type EmailTemplateConfig = {
  appName: string;
  supportEmail: string;

  verificationExpiresIn: string;
  resetPasswordExpiresIn: string;
  setPasswordExpiresIn: string;
};
