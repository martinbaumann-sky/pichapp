const primaryAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const additionalAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";

export const ADMIN_EMAILS = [primaryAdminEmail, ...additionalAdminEmails.split(",")]
  .map((email) => email?.trim())
  .filter((email, index, all) => Boolean(email) && all.indexOf(email) === index);

export const ADMIN_EMAIL = ADMIN_EMAILS[0] ?? "";
