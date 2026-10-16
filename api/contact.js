const allowedOrigins = new Set([
  'https://amandacarolinebergklint.github.io',
  'https://personal-brand-amanda-bergklint.vercel.app',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
]);

const recentSubmissions = new Map();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;

  res.setHeader('Vary', 'Origin');
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();

  // Quietly accept filled honeypot fields to avoid teaching simple bots about the check.
  if (String(body.website || '').trim()) return res.status(200).json({ ok: true });

  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !message || message.length > 5000) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'service_not_configured' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const recent = (recentSubmissions.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= LIMIT) return res.status(429).json({ error: 'rate_limited' });
  recent.push(now);
  recentSubmissions.set(ip, recent);

  const sender = process.env.CONTACT_FROM || 'Amanda Bergklint <onboarding@resend.dev>';
  const recipient = process.env.CONTACT_TO || 'amandacaroline.bergklint@gmail.com';
  const text = `Namn: ${name}\nE-post: ${email}\n\nMeddelande:\n${message}`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: `Meddelande från portfolio – ${name}`,
        text
      })
    });

    if (!response.ok) return res.status(502).json({ error: 'email_delivery_failed' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'email_delivery_failed' });
  }
};
