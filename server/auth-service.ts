import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { db } from './db';
import { users, userSessions, emailVerifications, passwordResets } from '@shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import type { 
  User, 
  InsertUser, 
  UserSession, 
  InsertUserSession, 
  RegisterData, 
  LoginData, 
  AuthResult, 
  GoogleUserInfo 
} from '@shared/schema';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Password validation
  validatePassword(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Compare passwords
  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Register new user
  async registerUser(data: RegisterData): Promise<User> {
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('Email bereits registriert');
    }

    // Validate password
    if (!this.validatePassword(data.password)) {
      throw new Error('Passwort muss mindestens 8 Zeichen haben und Groß-/Kleinbuchstaben sowie Zahlen enthalten');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        authProvider: 'local',
        emailVerified: false,
      })
      .returning();

    // Send verification email (optional implementation)
    // await this.sendVerificationEmail(user);

    return user;
  }

  // Login user
  async loginUser(data: LoginData): Promise<AuthResult> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new Error('Ungültige Anmeldedaten');
    }

    const isValidPassword = await this.comparePasswords(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Ungültige Anmeldedaten');
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: { ...user, lastLoginAt: new Date() },
      sessionToken: session.id
    };
  }

  // Google OAuth login
  async loginWithGoogle(googleUser: GoogleUserInfo): Promise<AuthResult> {
    let user: User;

    // Check if user exists by Google ID
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleUser.id))
      .limit(1);

    if (existingUser) {
      user = existingUser;
    } else {
      // Check if user exists by email
      const [existingEmailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      if (existingEmailUser) {
        // Link Google account to existing user
        [user] = await db
          .update(users)
          .set({
            googleId: googleUser.id,
            authProvider: 'google',
            emailVerified: true,
            profileImageUrl: googleUser.picture || existingEmailUser.profileImageUrl,
          })
          .where(eq(users.id, existingEmailUser.id))
          .returning();
      } else {
        // Create new Google user
        [user] = await db
          .insert(users)
          .values({
            id: randomUUID(),
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            profileImageUrl: googleUser.picture || null,
            authProvider: 'google',
            googleId: googleUser.id,
            emailVerified: true,
          })
          .returning();
      }
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: { ...user, lastLoginAt: new Date() },
      sessionToken: session.id
    };
  }

  // Create session
  async createSession(userId: string): Promise<UserSession> {
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const [session] = await db
      .insert(userSessions)
      .values({
        id: sessionToken,
        userId,
        expiresAt,
      })
      .returning();

    return session;
  }

  // Validate session
  async validateSession(sessionToken: string): Promise<User | null> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.id, sessionToken),
      ))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await db
          .delete(userSessions)
          .where(eq(userSessions.id, sessionToken));
      }
      return null;
    }

    // Update last accessed
    await db
      .update(userSessions)
      .set({ lastAccessedAt: new Date() })
      .where(eq(userSessions.id, sessionToken));

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return user || null;
  }

  // Invalidate session (logout)
  async invalidateSession(sessionToken: string): Promise<void> {
    await db
      .delete(userSessions)
      .where(eq(userSessions.id, sessionToken));
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    await db
      .delete(userSessions)
      .where(eq(userSessions.expiresAt, new Date()));
  }

  // Send verification email (placeholder)
  async sendVerificationEmail(user: User): Promise<void> {
    // Implementation would go here
    console.log(`Verification email would be sent to ${user.email}`);
  }

  // Password Reset Functions
  async requestPasswordReset(email: string): Promise<void> {
    // Check if user exists
    const user = await this.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    // Generate reset token
    const resetToken = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    console.log('Generated reset token:', resetToken);
    console.log('Token expires at:', expiresAt.toISOString());

    // Store reset token in database
    await db
      .insert(passwordResets)
      .values({
        userId: user.id,
        resetToken,
        expiresAt,
        used: false,
      });

    // Send password reset email
    await this.sendPasswordResetEmail(user, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('Attempting password reset with token:', token);
    console.log('Current time:', new Date().toISOString());
    
    // Find valid reset token
    const [resetRecord] = await db
      .select()
      .from(passwordResets)
      .where(and(
        eq(passwordResets.resetToken, token),
        eq(passwordResets.used, false),
        gt(passwordResets.expiresAt, new Date())
      ))
      .limit(1);

    console.log('Reset record for password reset:', resetRecord);

    if (!resetRecord) {
      console.log('No valid reset record found');
      throw new Error('Ungültiger oder abgelaufener Reset-Token');
    }

    // Validate new password
    if (!this.validatePassword(newPassword)) {
      throw new Error('Passwort muss mindestens 8 Zeichen haben und Groß-/Kleinbuchstaben sowie Zahlen enthalten');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user's password
    await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date() 
      })
      .where(eq(users.id, resetRecord.userId));

    // Mark reset token as used
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.id, resetRecord.id));

    // Invalidate all existing sessions for security
    await db
      .delete(userSessions)
      .where(eq(userSessions.userId, resetRecord.userId));
  }

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      console.log('Verifying reset token:', token);
      console.log('Current time:', new Date().toISOString());
      
      const [resetRecord] = await db
        .select()
        .from(passwordResets)
        .where(and(
          eq(passwordResets.resetToken, token),
          eq(passwordResets.used, false),
          gt(passwordResets.expiresAt, new Date())
        ))
        .limit(1);

      console.log('Reset record found:', resetRecord);
      
      if (!resetRecord) {
        // Debug: Check if token exists at all
        const [anyRecord] = await db
          .select()
          .from(passwordResets)
          .where(eq(passwordResets.resetToken, token))
          .limit(1);
        
        console.log('Any record with this token:', anyRecord);
        if (anyRecord) {
          console.log('Token exists but:', {
            used: anyRecord.used,
            expiresAt: anyRecord.expiresAt,
            currentTime: new Date(),
            isExpired: anyRecord.expiresAt <= new Date()
          });
        }
      }

      return !!resetRecord;
    } catch (error) {
      console.error('Database error in verifyResetToken:', error);
      throw error;
    }
  }

  private async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    if (!resend) {
      console.error('Resend API key not configured');
      return;
    }

    // Auto-detect frontend URL based on environment
    const frontendUrl = process.env.FRONTEND_URL || 'https://tm-2-poc-nocodereviews.replit.app';
    
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    console.log(`Sending password reset email to ${user.email} with URL: ${resetUrl}`);

    try {
      await resend.emails.send({
        from: 'TakeMeTo <noreply@takemeto.ai>',
        to: [user.email],
        subject: 'Reset Your Password - TakeMeTo.ai',
        html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

<div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eeeeee; margin-bottom: 30px;">
  <h1 style="color: #007bff; font-size: 24px; margin: 0; font-weight: bold;">TakeMeTo.ai</h1>
</div>

<div style="padding: 20px 0;">
  <h2 style="color: #333333; margin-bottom: 20px;">Hello ${user.firstName || user.email}!</h2>
  <p style="margin-bottom: 20px;">You have requested to reset your password for your TakeMeTo.ai account.</p>
  
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #007bff;">
    <p style="margin-top: 0; font-weight: bold;">Create New Password</p>
    <p style="margin-bottom: 20px;">Click the button below to create a new password:</p>
    <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
    <p style="font-size: 14px; color: #666666; margin-bottom: 0;">This link will expire in 1 hour.</p>
  </div>
  
  <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 20px 0; color: #856404;">
    <p style="margin: 0; font-weight: bold;">Security Notice:</p>
    <p style="margin: 10px 0 0 0;">If you did not request this password reset, simply ignore this email. Your password will remain unchanged.</p>
  </div>
  
  <p style="margin-bottom: 10px;">If the button above doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px; margin: 0;">${resetUrl}</p>
</div>

<div style="text-align: center; color: #666666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
  <p style="margin: 0 0 10px 0;">This email was sent automatically by TakeMeTo.ai</p>
  <p style="margin: 0;">If you have any questions, please contact our support team.</p>
</div>

</body>
</html>`,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  // Clean up expired reset tokens
  async cleanupExpiredResetTokens(): Promise<void> {
    await db
      .delete(passwordResets)
      .where(lt(passwordResets.expiresAt, new Date()));
  }
}

export const authService = new AuthService();