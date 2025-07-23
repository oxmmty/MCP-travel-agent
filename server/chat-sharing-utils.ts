import crypto from 'crypto';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Generate unique tokens for sharing and invitations
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Calculate expiration dates
export function getInvitationExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 7 days
  return expiry;
}

export function getShareLinkExpiry(days: number = 30): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

// Email templates for chat invitations
export interface ChatEmailInvitation {
  to: string;
  inviterName: string;
  chatTitle: string;
  chatPreview: string; // First few messages or description
  inviteLink: string;
  previewImageUrl?: string;
}

export async function sendChatInvitationEmail(invitation: ChatEmailInvitation) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TakeMeTo <noreply@takemeto.ai>',
      to: [invitation.to],
      subject: `You're invited to join "${invitation.chatTitle}" chat`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px 0;
              }
              .chat-card {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                border-left: 4px solid #007bff;
              }
              .chat-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 12px;
                color: #2c3e50;
              }
              .chat-preview {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
                font-style: italic;
                line-height: 1.5;
              }
              .invite-button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">TakeMeTo.ai</div>
            </div>
            
            <h2>You're invited to join a travel planning chat!</h2>
            
            <p>Hi there!</p>
            
            <p><strong>${invitation.inviterName}</strong> has invited you to join their travel planning conversation:</p>
            
            <div class="chat-card">
              <div class="chat-title">${invitation.chatTitle}</div>
              <div class="chat-preview">${invitation.chatPreview}</div>
              <a href="${invitation.inviteLink}" class="invite-button">Join Chat</a>
            </div>
            
            <p>Join the conversation and help plan this amazing trip together! You'll be able to:</p>
            <ul>
              <li>💬 Participate in travel planning discussions</li>
              <li>🗺️ Explore destinations and attractions</li>
              <li>📅 Collaborate on itinerary planning</li>
              <li>🏨 Help choose accommodations</li>
            </ul>
            
            <p>Click the button above or use this link: <a href="${invitation.inviteLink}">${invitation.inviteLink}</a></p>
            
            <div class="footer">
              <p>This invitation was sent by ${invitation.inviterName} through TakeMeTo.ai</p>
              <p>If you don't want to receive these invitations, you can ignore this email.</p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Generate shareable chat link
export function generateChatShareLink(accessToken: string, baseUrl?: string): string {
  const base = baseUrl || process.env.FRONTEND_URL || 'https://takemeto.ai';
  return `${base}/shared/chat/${accessToken}`;
}

// Validate access token format
export function isValidAccessToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

// JWT utilities for secure chat access
export function generateChatAccessJWT(payload: { 
  chatId: number; 
  accessLevel: string; 
  sessionToken?: string; 
}): string {
  // Simple JWT-like token generation (in production, use proper JWT library)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
    
  return `${header}.${payloadStr}.${signature}`;
}

export function verifyChatAccessJWT(token: string): any {
  try {
    const [header, payload, signature] = token.split('.');
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch (error) {
    return null;
  }
}

// Send platform invitation email
export async function sendPlatformInvitationEmail({
  to,
  inviterName,
  inviteLink
}: {
  to: string;
  inviterName: string;
  inviteLink: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'TakeMeTo.ai <noreply@takemeto.ai>',
      to: [to],
      subject: `${inviterName} invited you to join TakeMeTo.ai`,
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px 0;
              }
              .platform-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                padding: 30px;
                margin: 24px 0;
                text-align: center;
              }
              .platform-title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 12px;
              }
              .platform-subtitle {
                font-size: 18px;
                opacity: 0.9;
                margin-bottom: 20px;
              }
              .invite-button {
                display: inline-block;
                background: white;
                color: #667eea;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              }
              .features {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 14px;
                color: #666;
                text-align: center;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">TakeMeTo.ai</div>
            </div>
            
            <div class="platform-card">
              <div class="platform-title">Welcome to TakeMeTo.ai</div>
              <div class="platform-subtitle">${inviterName} invited you to join our travel planning platform</div>
              <a href="${inviteLink}" class="invite-button">Join TakeMeTo.ai</a>
            </div>
            
            <p>Hi there!</p>
            
            <p><strong>${inviterName}</strong> has invited you to join TakeMeTo.ai, the AI-powered travel planning platform.</p>
            
            <div class="features">
              <h3>What you can do with TakeMeTo.ai:</h3>
              <ul>
                <li>🤖 Get AI-powered travel recommendations tailored to your preferences</li>
                <li>🗺️ Explore interactive maps with hotels, attractions, and restaurants</li>
                <li>👥 Plan trips collaboratively with friends and family</li>
                <li>💬 Share travel conversations and ideas</li>
                <li>📱 Access from any device with our responsive web interface</li>
              </ul>
            </div>
            
            <p>Join thousands of travelers who are already planning their dream trips with AI assistance!</p>
            
            <p>Click the button above or use this link: <a href="${inviteLink}">${inviteLink}</a></p>
            
            <div class="footer">
              <p>This invitation was sent by ${inviterName} through TakeMeTo.ai</p>
              <p>If you don't want to receive these invitations, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}