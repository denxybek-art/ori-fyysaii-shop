export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: 'Server not configured' });
    }

    const { image, mimeType, username, robux, amount } = req.body || {};

    if (!image || !username || !mimeType) {
      return res.status(400).json({ error: 'Missing information' });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return res.status(400).json({ error: 'Invalid image type' });
    }

    const buffer = Buffer.from(image, 'base64');

    if (!buffer.length || buffer.length > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be under 3MB' });
    }

    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', new Blob([buffer], { type: mimeType }), 'receipt.jpg');
    form.append(
  'caption',
  `🛒 NEW ORDER\n\n👤 Username: ${String(username).slice(0, 20)}\n💎 Total Robux: ${String(robux || '').slice(0, 30)}\n💵 Price: ${String(amount || '').slice(0, 30)}\n\n⏳ Status: PENDING`
);
    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return res.status(502).json({ error: 'Telegram delivery failed' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Could not send receipt' });
  }
}
