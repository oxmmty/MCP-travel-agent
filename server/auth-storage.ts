import { db } from './db';
import { users, userSessions, emailVerifications, passwordResets, chats } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  User, 
  InsertUser, 
  UpdateUser,
  UserSession, 
  InsertUserSession,
  EmailVerification,
  InsertEmailVerification,
  PasswordReset,
  InsertPasswordReset,
  Chat,
  InsertChat
} from '@shared/schema';

export interface IAuthStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Session operations
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(sessionId: string): Promise<UserSession | undefined>;
  updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession>;
  deleteSession(sessionId: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Email verification operations
  createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerification(token: string): Promise<EmailVerification | undefined>;
  deleteEmailVerification(token: string): Promise<void>;

  // Password reset operations
  createPasswordReset(reset: InsertPasswordReset): Promise<PasswordReset>;
  getPasswordReset(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetUsed(token: string): Promise<void>;
  deletePasswordReset(token: string): Promise<void>;

  // Chat operations (updated for new user ID format)
  createChat(chat: InsertChat): Promise<Chat>;
  getUserChats(userId: string): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  updateChat(id: number, updates: Partial<Chat>): Promise<Chat>;
  deleteChat(id: number): Promise<void>;
}

export class DatabaseAuthStorage implements IAuthStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Session operations
  async createSession(sessionData: InsertUserSession): Promise<UserSession> {
    const [session] = await db.insert(userSessions).values(sessionData).returning();
    return session;
  }

  async getSession(sessionId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, sessionId))
      .limit(1);
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession> {
    const [session] = await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.id, sessionId))
      .returning();
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.id, sessionId));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(userSessions).where(eq(userSessions.expiresAt, now));
  }

  // Email verification operations
  async createEmailVerification(verificationData: InsertEmailVerification): Promise<EmailVerification> {
    const [verification] = await db.insert(emailVerifications).values(verificationData).returning();
    return verification;
  }

  async getEmailVerification(token: string): Promise<EmailVerification | undefined> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.verificationToken, token))
      .limit(1);
    return verification;
  }

  async deleteEmailVerification(token: string): Promise<void> {
    await db.delete(emailVerifications).where(eq(emailVerifications.verificationToken, token));
  }

  // Password reset operations
  async createPasswordReset(resetData: InsertPasswordReset): Promise<PasswordReset> {
    const [reset] = await db.insert(passwordResets).values(resetData).returning();
    return reset;
  }

  async getPasswordReset(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(and(
        eq(passwordResets.resetToken, token),
        eq(passwordResets.used, false)
      ))
      .limit(1);
    return reset;
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    await db
      .update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.resetToken, token));
  }

  async deletePasswordReset(token: string): Promise<void> {
    await db.delete(passwordResets).where(eq(passwordResets.resetToken, token));
  }

  // Chat operations (updated for new user ID format)
  async createChat(chatData: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats).values(chatData).returning();
    return chat;
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
    return chat;
  }

  async updateChat(id: number, updates: Partial<Chat>): Promise<Chat> {
    const [chat] = await db
      .update(chats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chats.id, id))
      .returning();
    return chat;
  }

  async deleteChat(id: number): Promise<void> {
    await db.delete(chats).where(eq(chats.id, id));
  }
}

export const authStorage = new DatabaseAuthStorage();