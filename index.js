import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

// Stats tracker
const stats = {
  text: 0,
  photo: 0,
  video: 0,
  document: 0,
  voice: 0,
  sticker: 0,
  location: 0,
  total: 0
};

// Start command
bot.start((ctx) => {
  ctx.reply("👋 Welcome! Send me any message (text, photo, etc.), and I'll forward it to the admin channel.");
});

// Ask for location
bot.command('location', (ctx) => {
  ctx.reply('📍 Please share your location:', {
    reply_markup: {
      keyboard: [[{
        text: "📍 Send My Location",
        request_location: true
      }]],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

// Stats command
bot.command('stats', (ctx) => {
  const message = `
📊 Bot Usage Stats:
📝 Texts: ${stats.text}
📷 Photos: ${stats.photo}
🎥 Videos: ${stats.video}
📎 Documents: ${stats.document}
🎤 Voice Messages: ${stats.voice}
🧩 Stickers: ${stats.sticker}
📍 Locations: ${stats.location}
📈 Total Messages: ${stats.total}
`;
  ctx.reply(message);
});

// Handle messages
bot.on('message', async (ctx) => {
  const msg = ctx.message;
  const user = ctx.from;

  const senderName = user.username
    ? `@${user.username}`
    : `${user.first_name || 'Anonymous User'}`;
  const senderId = user.id;
  const header = `📨 From ${senderName} (ID: ${senderId}):\n`;

  try {
    if (msg.text) {
      stats.text++;
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}${msg.text}`);
    } else if (msg.photo) {
      stats.photo++;
      const photo = msg.photo.at(-1).file_id;
      await ctx.telegram.sendPhoto(CHANNEL_ID, photo, {
        caption: `${header}${msg.caption || ''}`
      });
    } else if (msg.video) {
      stats.video++;
      await ctx.telegram.sendVideo(CHANNEL_ID, msg.video.file_id, {
        caption: `${header}${msg.caption || ''}`
      });
    } else if (msg.document) {
      stats.document++;
      await ctx.telegram.sendDocument(CHANNEL_ID, msg.document.file_id, {
        caption: `${header}${msg.caption || ''}`
      });
    } else if (msg.voice) {
      stats.voice++;
      await ctx.telegram.sendVoice(CHANNEL_ID, msg.voice.file_id);
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}(sent a voice message 🎤)`);
    } else if (msg.sticker) {
      stats.sticker++;
      await ctx.telegram.sendSticker(CHANNEL_ID, msg.sticker.file_id);
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}(sent a sticker 🧩)`);
    } else if (msg.location) {
      stats.location++;
      const loc = msg.location;
      const locationText = `${header}📍 Location:\nLatitude: ${loc.latitude}\nLongitude: ${loc.longitude}`;
      await ctx.telegram.sendMessage(CHANNEL_ID, locationText);
    } else {
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}(sent an unsupported message type)`);
    }

    stats.total++;
    await ctx.reply("✅ Message forwarded with your name, ID, and type tracked.");
  } catch (err) {
    console.error("❌ Error forwarding message:", err);
    await ctx.reply("⚠️ Failed to forward your message.");
  }
});

// Webhook handler for Vercel
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (err) {
      console.error("Webhook Error:", err);
    }
    res.status(200).send('OK');
  } else {
    res.status(200).send('🤖 Telegram bot is live.');
  }
        }
