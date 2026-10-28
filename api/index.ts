import Stripe from 'stripe';

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
};

export default async function handler(req: any, res: any) {
  const stripe = getStripe();
  const urlPath = (req.url || '').split('?')[0];

  // Parse body if needed
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  // 1. GET /api/payment-config
  if (urlPath.endsWith('/payment-config') && req.method === 'GET') {
    return res.status(200).json({
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      currency: 'GBP',
      currencySymbol: '£',
    });
  }

  // 2. POST /api/create-payment-intent
  if (urlPath.endsWith('/create-payment-intent') && req.method === 'POST') {
    try {
      if (!stripe) {
        return res.status(400).json({
          error: 'STRIPE_SECRET_KEY is missing in Vercel Environment Variables.',
          configured: false,
        });
      }

      const {
        amount,
        currency = 'gbp',
        customerEmail,
        customerName,
        isEmbeddedIframe = false,
        metadata = {},
      } = body;

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
        ...(isEmbeddedIframe
          ? { payment_method_types: ['card'] }
          : {
              automatic_payment_methods: {
                enabled: true,
              },
            }),
        description: `Savoria Bistro Order for ${customerName || 'Customer'}`,
        receipt_email: cleanEmail,
        metadata: {
          ...metadata,
          customerName: customerName || 'Valued Guest',
          source: 'Savoria Artisanal Bistro Online',
        },
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
      });
    } catch (err: any) {
      console.error('Vercel Stripe PaymentIntent error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to initialize payment',
      });
    }
  }

  // 3. POST /api/create-checkout-session
  if (urlPath.endsWith('/create-checkout-session') && req.method === 'POST') {
    try {
      if (!stripe) {
        return res.status(400).json({
          error: 'STRIPE_SECRET_KEY is missing in Vercel Environment Variables.',
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
      } = body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty. Please add items.' });
      }

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

      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const origin = req.headers.origin || `${proto}://${host}`;

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

      return res.status(200).json({
        url: session.url,
        id: session.id,
      });
    } catch (err: any) {
      console.error('Vercel Stripe Checkout Session error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to create Stripe Checkout session',
      });
    }
  }

  // 4. GET /api/verify-checkout-session
  if (urlPath.endsWith('/verify-checkout-session') && req.method === 'GET') {
    try {
      const sessionId = req.query?.sessionId as string;
      if (!sessionId || !stripe) {
        return res.status(400).json({ error: 'Session ID and Stripe configuration required' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return res.status(200).json({
        paid: session.payment_status === 'paid',
        status: session.status,
        customerEmail: session.customer_details?.email || session.customer_email,
        customerName: session.customer_details?.name || session.metadata?.customerName,
        metadata: session.metadata,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : '',
      });
    } catch (err: any) {
      console.error('Vercel Verify Checkout Session error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to retrieve session' });
    }
  }

  // 5. GET /api/verify-payment-intent
  if (urlPath.endsWith('/verify-payment-intent') && req.method === 'GET') {
    try {
      const paymentIntentId = req.query?.paymentIntentId as string;
      if (!paymentIntentId || !stripe) {
        return res.status(400).json({ error: 'PaymentIntent ID and Stripe configuration required' });
      }

      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      return res.status(200).json({
        paid: pi.status === 'succeeded' || pi.status === 'processing',
        status: pi.status,
        amountTotal: pi.amount ? pi.amount / 100 : 0,
        customerEmail: pi.receipt_email || '',
        metadata: pi.metadata || {},
        paymentIntentId: pi.id,
      });
    } catch (err: any) {
      console.error('Vercel Verify PaymentIntent error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to retrieve PaymentIntent' });
    }
  }

  return res.status(404).json({ error: 'API endpoint not found' });
}
