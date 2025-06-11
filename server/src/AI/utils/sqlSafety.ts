export const validateSQL = (sql: string): void => {
  if (typeof sql !== "string") {
    throw new Error("Invalid SQL input");
  }

  const normalized = sql.trim().toLowerCase();

  // שאילתה חייבת להתחיל ב־select
  if (!normalized.startsWith("select")) {
    throw new Error("Only SELECT queries are allowed.");
  }

  // אסור שתהיה יותר מפעם אחת נקודה-פסיק לא ריקה
  const parts = normalized.split(";").filter(part => part.trim() !== "");

  if (parts.length > 1) {
    throw new Error("Multiple SQL statements are not allowed.");
  }

  const FORBIDDEN_PATTERNS = [
    /\b(drop|delete|truncate|alter|create|insert|update)\b\s+/i,
    /\bexec\b/i,
    /\bgrant\b/i,
  ];

  const forbidden = FORBIDDEN_PATTERNS.find((pattern) => pattern.test(normalized));
  if (forbidden) {
    throw new Error("Unsafe SQL query detected: usage of forbidden keyword.");
  }
};
