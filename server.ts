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
// CRITICAL: AI Studio Nginx listens on 8080 and proxies to Node on port 3000.
// Node MUST always listen on port 3000.
const PORT = 3000;

app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// 1. Stripe Hosted Checkout Session creation endpoint (Direct to Stripe Payment Page)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({
        error: 'Stripe is not configured yet in .env file.',
        configured: false,
      });
    }

    const {
      items = [],
      deliveryFee = 0,
      customerName = '',
      customerPhone = '',
      customerEmail = '',
      deliveryAddress = '',
      userId = '',
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items.' });
    }

    // Build line items for Stripe Checkout
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          images: item.imageUrl && item.imageUrl.startsWith('http') ? [item.imageUrl] : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    // Add delivery fee if applicable
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Doorstep Delivery Fee',
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.origin || `http://localhost:${PORT}`;
    const cleanEmail =
      typeof customerEmail === 'string' && customerEmail.includes('@') && !customerEmail.includes(' ')
        ? customerEmail.trim()
        : undefined;

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      customer_email: cleanEmail,
      metadata: {
        customerName: customerName || 'Valued Guest',
        customerPhone: customerPhone || '',
        deliveryAddress: deliveryAddress || '',
        userId: userId || 'guest',
        orderItemsJson: JSON.stringify(
          items.map((i: any) => ({
            menuItemId: i.menuItemId || i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            imageUrl: i.imageUrl || '',
          }))
        ),
      },
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&order_success=true`,
      cancel_url: `${origin}/?order_cancelled=true`,
    });

    return res.json({
      url: session.url,
      id: session.id,
    });
  } catch (err: any) {
    console.error('Stripe Checkout Session error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to create Stripe Checkout session',
    });
  }
});

// 2. Verify Checkout Session on return
app.get('/api/verify-checkout-session', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId || !stripe) {
      return res.status(400).json({ error: 'Session ID and Stripe configuration required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      paid: session.payment_status === 'paid',
      status: session.status,
      customerEmail: session.customer_details?.email || session.customer_email,
      customerName: session.customer_details?.name || session.metadata?.customerName,
      metadata: session.metadata,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
    });
  } catch (err: any) {
    console.error('Verify Checkout Session error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to retrieve session' });
  }
});

// 3. Fallback PaymentIntent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({
        error: 'Stripe is not configured yet in .env file.',
        configured: false,
      });
    }

    const { amount, currency = 'gbp', customerEmail, customerName, metadata = {} } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const amountInMinorUnits = Math.round(amount * 100);
    const cleanEmail =
      typeof customerEmail === 'string' && customerEmail.includes('@') && !customerEmail.includes(' ')
        ? customerEmail.trim()
        : undefined;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Savoria Bistro Order for ${customerName || 'Customer'}`,
      receipt_email: cleanEmail,
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
      error: err?.message || 'Failed to initialize payment',
    });
  }
});

// Config status
app.get('/api/payment-config', (_req, res) => {
  res.json({
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPublishableKey: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    currency: 'GBP',
    currencySymbol: '£',
  });
});

// Explicit JSON 404 for any unhandled /api calls so Vite never serves HTML for API calls
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
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
