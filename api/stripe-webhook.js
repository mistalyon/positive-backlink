// Stripe Webhook Handler - Vercel Serverless Function
// Required env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// To activate:
// 1. npm install stripe @supabase/supabase-js (add to package.json)
// 2. Set env vars in Vercel Project Settings > Environment Variables
// 3. Configure webhook endpoint in Stripe Dashboard: https://yourdomain.com/api/stripe-webhook
// 4. Listen for events: checkout.session.completed, invoice.paid, customer.subscription.deleted

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const CREDIT_PACKS = {
  pack50: 50,
  pack200: 200,
  pack1000: 1000
};

const PLAN_CREDITS = {
  pro: 150,
  agency: 600
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SECRET = process.env.STRIPE_SECRET_KEY;
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const SUPA_URL = process.env.SUPABASE_URL;
  const SUPA_SR = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SECRET || !WEBHOOK_SECRET || !SUPA_URL || !SUPA_SR) {
    return res.status(500).json({ error: 'Stripe webhook not configured. Missing env vars.' });
  }

  // TODO: dynamic import stripe + @supabase/supabase-js once npm packages are installed
  // const Stripe = (await import('stripe')).default;
  // const { createClient } = await import('@supabase/supabase-js');
  // const stripe = new Stripe(SECRET);
  // const sb = createClient(SUPA_URL, SUPA_SR);
  //
  // const sig = req.headers['stripe-signature'];
  // const buf = await buffer(req);
  // let event;
  // try { event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET); }
  // catch (err) { return res.status(400).json({ error: 'Invalid signature' }); }
  //
  // switch (event.type) {
  //   case 'checkout.session.completed': {
  //     const session = event.data.object;
  //     const email = session.customer_details?.email;
  //     const planKey = session.metadata?.plan_key; // pack50, pack200, pack1000, pro, agency
  //     const credits = CREDIT_PACKS[planKey] || PLAN_CREDITS[planKey] || 0;
  //     if (credits > 0 && email) {
  //       const { data: user } = await sb.from('users').select('id, credits').eq('email', email).maybeSingle();
  //       if (user) {
  //         const newBal = (user.credits || 0) + credits;
  //         await sb.from('users').update({ credits: newBal }).eq('id', user.id);
  //         await sb.from('credits_ledger').insert({
  //           user_id: user.id, type: 'purchase', amount: credits,
  //           balance_after: newBal, description: 'Stripe checkout: ' + planKey
  //         });
  //       }
  //     }
  //     break;
  //   }
  //   case 'invoice.paid': {
  //     // Recurring subscription renewal - grant monthly plan credits
  //     break;
  //   }
  //   case 'customer.subscription.deleted': {
  //     // Subscription cancelled - revert user to Starter plan
  //     break;
  //   }
  // }

  return res.status(200).json({ received: true, note: 'Stripe webhook handler not yet wired. Add npm packages and uncomment switch block.' });
}