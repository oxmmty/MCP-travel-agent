# Authentifizierungskonzept für Travel App

## Überblick

Ein eigenständiges Authentifizierungssystem mit lokaler Registrierung und Google OAuth Integration. Keine Abhängigkeit von Replit Auth oder Firebase.

## Authentifizierungsstrategien

### 1. Lokale Authentifizierung
- **Email/Password** Registrierung und Login
- **Sichere Passwort-Speicherung** mit bcrypt
- **JWT-basierte Sessions** für skalierbare Authentifizierung
- **Email-Verifizierung** für Kontosicherheit

### 2. Google OAuth Integration
- **Google OAuth 2.0** über native Google API (keine Firebase)
- **Seamless Integration** mit lokaler Benutzerverwaltung
- **Profildaten-Synchronisation** (Name, Email, Profilbild)
- **Account-Linking** für Benutzer mit mehreren Auth-Methoden

## Technische Architektur

### Database Schema

```sql
-- Erweiterte User-Tabelle für Multi-Auth
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,                    -- UUID für eindeutige IDs
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,                     -- NULL für OAuth-only Accounts
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  email_verified BOOLEAN DEFAULT FALSE,
  auth_provider VARCHAR DEFAULT 'local',    -- 'local', 'google'
  google_id VARCHAR UNIQUE,                 -- Google OAuth ID
  preferred_language VARCHAR DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Email-Verifizierung
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  verification_token VARCHAR UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Session-Management
CREATE TABLE user_sessions (
  id VARCHAR PRIMARY KEY,                   -- Session Token
  user_id VARCHAR REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- Password Reset
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  reset_token VARCHAR UNIQUE,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Backend Implementation

```typescript
// server/auth-service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export class AuthService {
  // Lokale Registrierung
  async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    // Email-Duplikat prüfen
    const existingUser = await this.storage.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Email bereits registriert');
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(data.password, 12);

    // User erstellen
    const user = await this.storage.createUser({
      id: randomUUID(),
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      authProvider: 'local',
      emailVerified: false
    });

    // Email-Verifizierung senden
    await this.sendVerificationEmail(user);
    
    return user;
  }

  // Lokaler Login
  async loginUser(email: string, password: string): Promise<AuthResult> {
    const user = await this.storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Ungültige Anmeldedaten');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Ungültige Anmeldedaten');
    }

    // Session erstellen
    const session = await this.createSession(user.id);
    
    return { user, sessionToken: session.id };
  }

  // Google OAuth Login
  async loginWithGoogle(googleUser: GoogleUserInfo): Promise<AuthResult> {
    let user = await this.storage.getUserByGoogleId(googleUser.id);
    
    if (!user) {
      // Neuen Google-User erstellen
      user = await this.storage.createUser({
        id: randomUUID(),
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        profileImageUrl: googleUser.picture,
        authProvider: 'google',
        googleId: googleUser.id,
        emailVerified: true // Google Accounts sind verifiziert
      });
    }

    // Session erstellen
    const session = await this.createSession(user.id);
    
    return { user, sessionToken: session.id };
  }

  // Session-Verwaltung
  async createSession(userId: string): Promise<Session> {
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

    return await this.storage.createSession({
      id: sessionToken,
      userId,
      expiresAt
    });
  }

  async validateSession(sessionToken: string): Promise<User | null> {
    const session = await this.storage.getSession(sessionToken);
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Session-Aktivität aktualisieren
    await this.storage.updateSession(sessionToken, {
      lastAccessedAt: new Date()
    });

    return await this.storage.getUser(session.userId);
  }
}
```

### Google OAuth Integration

```typescript
// server/google-auth.ts
import { OAuth2Client } from 'google-auth-library';

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Authorization URL generieren
  getAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent'
    });
  }

  // Authorization Code zu User-Daten
  async getGoogleUser(authCode: string): Promise<GoogleUserInfo> {
    const { tokens } = await this.client.getToken(authCode);
    this.client.setCredentials(tokens);

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token');
    }

    return {
      id: payload.sub,
      email: payload.email!,
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
      picture: payload.picture || null
    };
  }
}
```

### API Routes

```typescript
// server/auth-routes.ts
export function registerAuthRoutes(app: Express) {
  const authService = new AuthService();
  const googleAuth = new GoogleAuthService();

  // Lokale Registrierung
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
      }

      const user = await authService.registerUser({
        email, password, firstName, lastName
      });

      res.status(201).json({
        message: 'Registrierung erfolgreich. Bitte E-Mail verifizieren.',
        user: { id: user.id, email: user.email, firstName: user.firstName }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Lokaler Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);

      // Session Cookie setzen
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
      });

      res.json({
        message: 'Anmeldung erfolgreich',
        user: result.user
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  // Google OAuth Start
  app.get('/api/auth/google', (req, res) => {
    const authUrl = googleAuth.getAuthUrl();
    res.redirect(authUrl);
  });

  // Google OAuth Callback
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      const googleUser = await googleAuth.getGoogleUser(code as string);
      const result = await authService.loginWithGoogle(googleUser);

      // Session Cookie setzen
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.redirect('/dashboard'); // Redirect nach erfolgreichem Login
    } catch (error) {
      res.redirect('/auth?error=google_auth_failed');
    }
  });

  // Logout
  app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      await authService.invalidateSession(sessionToken);
      
      res.clearCookie('session_token');
      res.json({ message: 'Erfolgreich abgemeldet' });
    } catch (error) {
      res.status(500).json({ error: 'Logout fehlgeschlagen' });
    }
  });

  // Aktueller User
  app.get('/api/auth/user', authMiddleware, (req, res) => {
    res.json(req.user);
  });
}
```

## Frontend Implementation

### React Auth Hook

```typescript
// client/src/hooks/useAuth.ts
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // User laden beim App-Start
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    setUser(data.user);
  };

  const register = async (data: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      loginWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Auth Page Component

```typescript
// client/src/pages/AuthPage.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthPage() {
  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await register({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string
      });
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Willkommen bei TakeMeTo.ai
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Melden Sie sich an oder erstellen Sie ein Konto
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Anmeldung</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    name="email"
                    type="email"
                    placeholder="E-Mail-Adresse"
                    required
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Passwort"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Anmeldung...' : 'Anmelden'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    name="firstName"
                    type="text"
                    placeholder="Vorname"
                    required
                  />
                  <Input
                    name="lastName"
                    type="text"
                    placeholder="Nachname"
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="E-Mail-Adresse"
                    required
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Passwort"
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registrierung...' : 'Registrieren'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Oder</span>
                </div>
              </div>

              <Button
                onClick={loginWithGoogle}
                variant="outline"
                className="w-full mt-4"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Mit Google anmelden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Sicherheitsfeatures

### 1. Password Security
```typescript
// Passwort-Stärke Validierung
export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password);
};

// Rate Limiting für Login-Versuche
const loginAttempts = new Map<string, number>();
export const checkRateLimit = (email: string): boolean => {
  const attempts = loginAttempts.get(email) || 0;
  return attempts < 5; // Max 5 Versuche
};
```

### 2. Session Management
```typescript
// Session-Middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sessionToken = req.cookies.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const user = await authService.validateSession(sessionToken);
  if (!user) {
    return res.status(401).json({ error: 'Session ungültig' });
  }

  req.user = user;
  next();
};
```

## Environment Variables

```env
# JWT Secret für Token-Signierung
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Email-Service (optional für Verifizierung)
EMAIL_SERVICE_API_KEY=your_email_service_key
FROM_EMAIL=noreply@takemeto.ai

# Database
DATABASE_URL=your_postgresql_url
```

## Implementierungsreihenfolge

### Phase 1: Grundsystem (1-2 Tage)
1. ✅ Database Schema erstellen
2. ✅ AuthService Backend implementieren
3. ✅ Auth Routes einrichten
4. ✅ Frontend Auth Hook erstellen

### Phase 2: UI Components (1 Tag)
5. ✅ Auth Page mit Login/Register Forms
6. ✅ Protected Routes implementieren
7. ✅ User-Menü in Navigation

### Phase 3: Google OAuth (1 Tag)
8. ✅ Google OAuth Service
9. ✅ OAuth Callback-Handling
10. ✅ Account-Linking Features

### Phase 4: Sicherheit (1 Tag)
11. ✅ Password-Stärke Validation
12. ✅ Rate Limiting
13. ✅ Session-Management optimieren

Die Implementierung ist vollständig eigenständig und erfordert nur Google OAuth Credentials - keine externen Auth-Services wie Firebase oder Replit Auth erforderlich.