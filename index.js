import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

// /start command
bot.start((ctx) => {
  ctx.reply("👋 Welcome! Send me any message, and I will forward it to the channel.");
});

// Forwarding handler
bot.on('message', async (ctx) => {
  const msg = ctx.message;
  const user = ctx.from;

  // Get user identity
  const sender = user.username
    ? `@${user.username}`
    : `${user.first_name || 'Anonymous User'}`;

  const header = `📨 Message from ${sender}:\n`;

  try {
    if (msg.text) {
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}${msg.text}`);
    } else if (msg.photo) {
      const photo = msg.photo.at(-1).file_id;
      await ctx.telegram.sendPhoto(CHANNEL_ID, photo, {
        caption: `${header}${msg.caption || ''}`
      });
    } else if (msg.video) {
      await ctx.telegram.sendVideo(CHANNEL_ID, msg.video.file_id, {
        caption: `${header}${msg.caption || ''}`
      });
    } else if (msg.document) {
      await ctx.telegram.sendDocument(CHANNEL_ID, msg.document.file_id, {
        caption: `${header}${msg.caption || ''}`
      });
    } else if (msg.voice) {
      await ctx.telegram.sendVoice(CHANNEL_ID, msg.voice.file_id);
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}(sent a voice message 🎤)`);
    } else if (msg.sticker) {
      await ctx.telegram.sendSticker(CHANNEL_ID, msg.sticker.file_id);
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}(sent a sticker 🧩)`);
    } else {
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}(sent an unsupported message type)`);
    }

    // Confirm to sender
    await ctx.reply("✅ Your message has been forwarded with your name.");
  } catch (err) {
    console.error("Forwarding failed:", err);
    await ctx.reply("❌ Failed to forward your message. Try again later.");
  }
});

// Vercel webhook endpoint
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (err) {
      console.error('Error handling update:', err);
    }
    res.status(200).send('OK');
  } else {
    res.status(200).send('🤖 Bot is running.');
  }
}
