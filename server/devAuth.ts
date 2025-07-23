import type { Express, RequestHandler } from "express";
import session from "express-session";
import { storage } from "./storage";

// Simple development authentication for local testing
// This will be replaced with Replit Auth in production

export function getDevSession() {
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // false for development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

export async function setupDevAuth(app: Express) {
  app.use(getDevSession());

  // Development login route - creates/logs in a test user
  app.get("/api/login", async (req: any, res) => {
    try {
      // Create or get test user
      const testUser = await storage.upsertUser({
        id: "dev_user_marcus",
        email: "marcus@test.de",
        firstName: "Marcus",
        lastName: "Burk",
        profileImageUrl: null,
        preferredLanguage: "de"
      });

      // Set session
      req.session.user = {
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        profileImageUrl: testUser.profileImageUrl
      };

      res.redirect("/");
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Development logout route
  app.get("/api/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.redirect("/");
    });
  });
}

// Development auth middleware
export const isDevAuthenticated: RequestHandler = (req: any, res, next) => {
  if (req.session && req.session.user) {
    req.user = {
      claims: {
        sub: req.session.user.id,
        email: req.session.user.email,
        first_name: req.session.user.firstName,
        last_name: req.session.user.lastName,
        profile_image_url: req.session.user.profileImageUrl
      }
    };
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};