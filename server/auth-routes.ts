import express from 'express';
import { authService } from './auth-service';
import { OAuth2Client } from 'google-auth-library';
import type { RegisterData, LoginData, GoogleUserInfo } from '@shared/schema';

const router = express.Router();

// Google OAuth client (only initialize if credentials are provided)
const googleClient = process.env.GOOGLE_CLIENT_ID 
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
  : null;

// Middleware to authenticate requests
export const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = await authService.validateSession(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const userData: RegisterData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    }

    const user = await authService.registerUser(userData);
    const result = await authService.loginUser({
      email: userData.email,
      password: userData.password
    });

    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        profileImageUrl: result.user.profileImageUrl,
        emailVerified: result.user.emailVerified,
        preferredLanguage: result.user.preferredLanguage
      },
      sessionToken: result.sessionToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Registrierung fehlgeschlagen'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const credentials: LoginData = req.body;
    
    if (!credentials.email || !credentials.password) {
      return res.status(400).json({ error: 'Email und Passwort sind erforderlich' });
    }

    const result = await authService.loginUser(credentials);
    
    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        profileImageUrl: result.user.profileImageUrl,
        emailVerified: result.user.emailVerified,
        preferredLanguage: result.user.preferredLanguage
      },
      sessionToken: result.sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ 
      error: error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen'
    });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID Token ist erforderlich' });
    }

    if (!googleClient) {
      return res.status(500).json({ error: 'Google OAuth ist nicht konfiguriert' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: 'Ungültiger Google Token' });
    }

    const googleUserInfo: GoogleUserInfo = {
      id: payload.sub,
      email: payload.email!,
      given_name: payload.given_name!,
      family_name: payload.family_name!,
      picture: payload.picture
    };

    const result = await authService.loginWithGoogle(googleUserInfo);
    
    res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        profileImageUrl: result.user.profileImageUrl,
        emailVerified: result.user.emailVerified,
        preferredLanguage: result.user.preferredLanguage
      },
      sessionToken: result.sessionToken
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Google-Anmeldung fehlgeschlagen'
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await authService.invalidateSession(token);
    }
    
    res.json({ message: 'Erfolgreich abgemeldet' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Abmeldung fehlgeschlagen' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        emailVerified: user.emailVerified,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Benutzerdaten konnten nicht abgerufen werden' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const updates = req.body;
    
    // Only allow certain fields to be updated
    const allowedUpdates = ['firstName', 'lastName', 'preferredLanguage'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'Keine gültigen Aktualisierungen angegeben' });
    }

    const updatedUser = await authService.getUserById(user.id);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        emailVerified: updatedUser.emailVerified,
        preferredLanguage: updatedUser.preferredLanguage
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profil konnte nicht aktualisiert werden' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse ist erforderlich' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    }

    await authService.requestPasswordReset(email);
    
    // Always return success message for security (don't reveal if email exists)
    res.json({ 
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts gesendet.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password-Reset-Anfrage fehlgeschlagen' });
  }
});

// Verify reset token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Verifying reset token via route:', token);
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(400).json({ error: 'Reset-Token ist erforderlich' });
    }

    const isValid = await authService.verifyResetToken(token);
    console.log('Token verification result:', isValid);
    
    if (!isValid) {
      console.log('Token verification failed');
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Reset-Token' });
    }

    console.log('Token verification successful');
    res.json({ valid: true, message: 'Token ist gültig' });
  } catch (error) {
    console.error('Token verification route error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ error: 'Token-Verifizierung fehlgeschlagen' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token und Passwort sind erforderlich' });
    }

    await authService.resetPassword(token, password);
    
    res.json({ message: 'Passwort wurde erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Passwort-Reset fehlgeschlagen'
    });
  }
});

export default router;