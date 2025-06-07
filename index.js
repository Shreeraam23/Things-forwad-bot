import { Telegraf } from 'telegraf';
import { createServer } from 'http';

const BOT_TOKEN = process.env.BOT_TOKEN || 'your-token';
const CHANNEL_ID = process.env.CHANNEL_ID || '@yourchannel';

const bot = new Telegraf(BOT_TOKEN);

// Forwarding all types of messages (same handlers from earlier)
bot.on('message', async (ctx) => {
  const from = ctx.from.username || 'Unknown';
  const message = ctx.message;

  if (message.text) {
    await ctx.telegram.sendMessage(CHANNEL_ID, `📨 From @${from}:\n${message.text}`);
  } else if (message.photo) {
    const photo = message.photo.at(-1).file_id;
    await ctx.telegram.sendPhoto(CHANNEL_ID, photo, { caption: `📷 From @${from}` });
  } else if (message.video) {
    await ctx.telegram.sendVideo(CHANNEL_ID, message.video.file_id, { caption: `🎥 From @${from}` });
  } else if (message.document) {
    await ctx.telegram.sendDocument(CHANNEL_ID, message.document.file_id, { caption: `📎 From @${from}` });
  } else if (message.voice) {
    await ctx.telegram.sendVoice(CHANNEL_ID, message.voice.file_id, { caption: `🎙️ From @${from}` });
  } else if (message.sticker) {
    await ctx.telegram.sendSticker(CHANNEL_ID, message.sticker.file_id);
  }
});

// Webhook handler for Vercel
export default function handler(req, res) {
  if (req.method === 'POST') {
    bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot is running');
  }
}
