/**
 * Stripe Payment Integration für LiteAPI Buchungen
 * Erstellt Payment Intents und verarbeitet Transaction IDs
 */

import Stripe from 'stripe';
import { Express } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil'
});

export function registerStripeRoutes(app: Express) {
  
  // Create Payment Intent für Hotel-Buchung
  app.post('/api/payments/create-intent', async (req, res) => {
    try {
      const { amount, currency = 'eur', prebookId, hotelName, guestName } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({
          error: 'Payment system not configured',
          message: 'Stripe integration not available'
        });
      }

      if (!amount || !prebookId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Amount and prebookId are required'
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          prebookId,
          hotelName: hotelName || 'Hotel Booking',
          guestName: guestName || 'Guest',
          type: 'hotel_booking'
        },
        description: `Hotel booking for ${hotelName || 'Hotel'} - Prebook ID: ${prebookId}`,
        automatic_payment_methods: {
          enabled: true
        }
      });

      console.log('✅ Stripe Payment Intent created:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        prebookId
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });

    } catch (error: any) {
      console.error('❌ Stripe Payment Intent creation failed:', error);
      res.status(500).json({
        error: 'Payment creation failed',
        message: error.message
      });
    }
  });

  // Verify Payment und retrieve Transaction ID
  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          error: 'Missing payment intent ID'
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        res.json({
          success: true,
          transactionId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        });
      } else {
        res.status(400).json({
          error: 'Payment not completed',
          status: paymentIntent.status,
          message: 'Payment must be completed before booking confirmation'
        });
      }

    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      res.status(500).json({
        error: 'Payment verification failed',
        message: error.message
      });
    }
  });

  // Webhook für Payment Status Updates
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        return res.status(400).send('Webhook secret not configured');
      }

      const event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('✅ Payment succeeded:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            prebookId: paymentIntent.metadata.prebookId
          });
          
          // Hier könnte automatische Buchungsbestätigung erfolgen
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          console.log('❌ Payment failed:', {
            id: failedPayment.id,
            prebookId: failedPayment.metadata.prebookId
          });
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error('❌ Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
}

export { stripe };