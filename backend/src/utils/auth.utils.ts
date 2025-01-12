import jwt from 'jsonwebtoken';
import { GOOGLE_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, JWT_SECRET } from '../utils/const';
import { IUserDocument } from '../interfaces/user.interface';
import { OAuth2Client } from 'google-auth-library';
import Logger from './logger';

export const generateAuthToken = (user: IUserDocument): string => {
  const payload = { userId: user._id, role: user.role };
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '30d' });
};

export const createAuthResponse = (user: IUserDocument) => {
  const token = generateAuthToken(user);
  return {
    token,
    user: user.apiRepresentation()
  };
};

if (!GOOGLE_CLIENT_ID) {
  Logger.error('GOOGLE_CLIENT_ID environment variable is not set');
  throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
}

export const googleClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_OAUTH_CLIENT_SECRET
});

export interface GoogleUserPayload {
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

export const verifyGoogleToken = async (token: string): Promise<GoogleUserPayload> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid token payload');
    }

    // Type assertion since we know the structure of the payload
    return payload as GoogleUserPayload;
  } catch (error) {
    Logger.error('Error verifying Google token:', error);
    throw new Error('Failed to verify Google token');
  }
};