import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export const base64Decoded = (base64String: string): string | null => {
  try {
    // אם זה לא נראה כמו base64, תחזיר כמו שזה
    if (!base64String || typeof base64String !== 'string') {
      return base64String;
    }
    
    // אם זה כבר מפוענח (לא base64), תחזיר כמו שזה
    if (!isBase64(base64String)) {
      return base64String;
    }
    
    // נסה לפענח base64
    return Buffer.from(base64String, 'base64').toString('utf-8');
  } catch (error) {
    console.warn('Base64 decode failed, returning original string:', error);
    return base64String; // תחזיר את המחרוזת המקורית
  }
}

// פונקציה עזר לבדוק אם מחרוזת היא base64 תקינה
function isBase64(str: string): boolean {
  try {
    // בדוק אם זה נראה כמו base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    
    // נסה לפענח ולהחזיר לbase64 - אם זה זהה, זה base64 תקין
    return btoa(atob(str)) === str;
  } catch (error) {
    return false;
  }
}

export const decodeBase64 = (base64String: string): string | null => {
  try {
    return atob(base64String);
  } catch (error) {
    return null;
  }
}