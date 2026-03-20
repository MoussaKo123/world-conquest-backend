// ═══════════════════════════════════════════════════════
//  WORLD CONQUEST — Backend Stripe
//  Déployer sur Railway.app (gratuit)
// ═══════════════════════════════════════════════════════

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'https://world-conquest-game.netlify.app' }));
app.use(express.json());

// ── PRICE IDs Stripe ──
const PACKS = {
  starter:    { priceId: 'price_1TBEn8DwOD3NBoVXCgfKlPDy', coins: 150 },
  basic:      { priceId: 'price_1TBEobDwOD3NBoVXz22LgMT8', coins: 400 },
  value:      { priceId: 'price_1TBErvDwOD3NBoVXEAz3ZO76', coins: 1000 },
  commander:  { priceId: 'price_1TBEvYDwOD3NBoVXPOCPlfjF', coins: 2000 },
  wargeneral: { priceId: 'price_1TBEx3DwOD3NBoVXU6fLETOw', coins: 3500 },
  supreme:    { priceId: 'price_1TBEySDwOD3NBoVXQ18aVQF7', coins: 10000 },
  bundle:     { priceId: 'price_1TBF0iDwOD3NBoVX6lH2h8Hu', coins: 250 },
};

// ── Créer une session de paiement Stripe ──
app.post('/create-checkout', async (req, res) => {
  const { packId } = req.body;
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ error: 'Pack invalide' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: pack.priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `https://world-conquest-game.netlify.app/?success=true&pack=${packId}&coins=${pack.coins}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://world-conquest-game.netlify.app/?cancelled=true`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Vérifier un paiement ──
app.get('/verify-payment', async (req, res) => {
  const { session_id } = req.query;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      res.json({ success: true, coins: parseInt(req.query.coins) });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──
app.get('/', (req, res) => res.json({ status: 'World Conquest API running ✅' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
