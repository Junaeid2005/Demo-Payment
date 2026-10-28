import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Stripe PaymentIntent creation endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({
        error: 'Stripe Secret Key is not configured yet in .env file. Please add STRIPE_SECRET_KEY.',
        configured: false,
      });
    }

    const { amount, currency = 'gbp', customerEmail, customerName, metadata = {} } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    // Amount in smallest unit (pence in GBP, cents in USD)
    const amountInMinorUnits = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Savoria Bistro Order for ${customerName || 'Customer'}`,
      receipt_email: customerEmail || undefined,
      metadata: {
        ...metadata,
        customerName: customerName || 'Valued Guest',
        source: 'Savoria Artisanal Bistro Online',
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (err: any) {
    console.error('Stripe PaymentIntent error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to initialize Stripe payment session',
    });
  }
});

// Endpoint to check Stripe configuration status
app.get('/api/payment-config', (_req, res) => {
  res.json({
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    currency: 'GBP',
    currencySymbol: '£',
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Savoria Bistro] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
