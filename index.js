import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN || '123456789:ABCDEFghIjkLMNOP';
const CHANNEL_ID = process.env.CHANNEL_ID || '-100xxxxxxxxxx'; // or -100XXXXXXXXXX

const bot = new Telegraf(BOT_TOKEN);

// Handle text messages
bot.on('text', async (ctx) => {
  const user = ctx.from.username || 'Unknown';
  const text = ctx.message.text;
  const message = `From @${user}:\n${text}`;
  await ctx.telegram.sendMessage(CHANNEL_ID, message);
});

// Handle photos
bot.on('photo', async (ctx) => {
  const user = ctx.from.username || 'Unknown';
  const caption = ctx.message.caption || '';
  const message = `📸 Photo from @${user}\n${caption}`;
  const photo = ctx.message.photo.at(-1).file_id; // highest resolution
  await ctx.telegram.sendPhoto(CHANNEL_ID, photo, { caption: message });
});

// Handle videos
bot.on('video', async (ctx) => {
  const user = ctx.from.username || 'Unknown';
  const caption = ctx.message.caption || '';
  const message = `🎥 Video from @${user}\n${caption}`;
  const video = ctx.message.video.file_id;
  await ctx.telegram.sendVideo(CHANNEL_ID, video, { caption: message });
});

// Handle documents
bot.on('document', async (ctx) => {
  const user = ctx.from.username || 'Unknown';
  const caption = ctx.message.caption || '';
  const message = `📎 Document from @${user}\n${caption}`;
  const document = ctx.message.document.file_id;
  await ctx.telegram.sendDocument(CHANNEL_ID, document, { caption: message });
});

// Handle voice messages
bot.on('voice', async (ctx) => {
  const user = ctx.from.username || 'Unknown';
  const message = `🎙️ Voice message from @${user}`;
  const voice = ctx.message.voice.file_id;
  await ctx.telegram.sendVoice(CHANNEL_ID, voice, { caption: message });
});

// Handle stickers
bot.on('sticker', async (ctx) => {
  const user = ctx.from.username || 'Unknown';
  const message = `🔖 Sticker from @${user}`;
  const sticker = ctx.message.sticker.file_id;
  await ctx.telegram.sendSticker(CHANNEL_ID, sticker);
});

bot.launch();

export default function handler(req, res) {
  res.status(200).send('✅ Telegram bot is running.');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
