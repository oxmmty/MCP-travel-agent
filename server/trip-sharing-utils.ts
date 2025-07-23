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

// Email templates
export interface EmailInvitation {
  to: string;
  inviterName: string;
  tripTitle: string;
  tripDestination: string;
  tripDates: string;
  inviteLink: string;
  previewImageUrl?: string;
}

export async function sendTripInvitationEmail(invitation: EmailInvitation) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'TakeMeTo <noreply@takemeto.ai>',
      to: [invitation.to],
      subject: `You're invited to plan a trip to ${invitation.tripDestination}`,
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
              .trip-card {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
              }
              .trip-image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 16px;
              }
              .trip-title {
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 8px;
              }
              .trip-details {
                color: #666;
                margin: 8px 0;
              }
              .button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 12px 32px;
                text-decoration: none;
                border-radius: 8px;
                margin: 24px 0;
                font-weight: 500;
              }
              .footer {
                text-align: center;
                color: #999;
                font-size: 14px;
                margin-top: 48px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>You're invited!</h1>
            </div>
            
            <p>Hi there,</p>
            
            <p>${invitation.inviterName} has invited you to help plan an exciting trip:</p>
            
            <div class="trip-card">
              ${invitation.previewImageUrl ? `<img src="${invitation.previewImageUrl}" alt="${invitation.tripDestination}" class="trip-image">` : ''}
              <h2 class="trip-title">${invitation.tripTitle}</h2>
              <p class="trip-details">📍 ${invitation.tripDestination}</p>
              <p class="trip-details">📅 ${invitation.tripDates}</p>
            </div>
            
            <p>Join the planning to:</p>
            <ul>
              <li>Suggest amazing places to visit</li>
              <li>Find the perfect hotels together</li>
              <li>Create an unforgettable itinerary</li>
              <li>Chat and coordinate with everyone</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${invitation.inviteLink}" class="button">View Trip</a>
            </div>
            
            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>© 2025 TakeMeTo. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `
${invitation.inviterName} has invited you to help plan a trip to ${invitation.tripDestination}!

Trip: ${invitation.tripTitle}
Destination: ${invitation.tripDestination}
Dates: ${invitation.tripDates}

Click here to view the trip: ${invitation.inviteLink}

This invitation will expire in 7 days.
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Format trip URL
export function formatTripUrl(tripPlanId: number, accessToken: string): string {
  const baseUrl = process.env.APP_URL || 'https://takemeto.ai';
  return `${baseUrl}/trip/${tripPlanId}?access=${accessToken}`;
}

export function formatInvitationUrl(tripPlanId: number, invitationToken: string): string {
  const baseUrl = process.env.APP_URL || 'https://takemeto.ai';
  return `${baseUrl}/trip/${tripPlanId}?invite=${invitationToken}`;
}