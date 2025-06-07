import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

// Reply to /start
bot.start((ctx) => {
  ctx.reply('👋 Hello! Your message will be forwarded to the channel.');
});

// Forward all messages
bot.on('message', async (ctx) => {
  const message = ctx.message;

  if (message.text) {
    await ctx.telegram.sendMessage(CHANNEL_ID, message.text);
  } else if (message.photo) {
    const photo = message.photo.at(-1).file_id;
    await ctx.telegram.sendPhoto(CHANNEL_ID, photo);
  } else if (message.video) {
    await ctx.telegram.sendVideo(CHANNEL_ID, message.video.file_id);
  } else if (message.document) {
    await ctx.telegram.sendDocument(CHANNEL_ID, message.document.file_id);
  } else if (message.voice) {
    await ctx.telegram.sendVoice(CHANNEL_ID, message.voice.file_id);
  } else if (message.sticker) {
    await ctx.telegram.sendSticker(CHANNEL_ID, message.sticker.file_id);
  } else {
    await ctx.telegram.sendMessage(CHANNEL_ID, 'Received a message I cannot forward.');
  }
});

// Webhook handler for Vercel
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (err) {
      console.error('Error handling update', err);
    }
    res.status(200).send('OK');
  } else {
    res.status(200).send('🤖 Bot is running.');
  }
}
