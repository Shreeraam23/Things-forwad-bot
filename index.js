import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;
const ADMIN_ID = process.env.ADMIN_ID; // Set your Telegram ID in env

const stats = {
  text: 0, photo: 0, video: 0, document: 0,
  voice: 0, sticker: 0, location: 0, total: 0
};

const waitingUsers = [];
const activePairs = new Map();
const bannedUsers = new Set();

bot.start((ctx) => {
  ctx.reply("");
});

bot.command('location', (ctx) => {
  ctx.reply("📍 Share your location:", {
    reply_markup: {
      keyboard: [[{ text: "📍 Send My Location", request_location: true }]],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

bot.command('stats', (ctx) => {
  const message = `
📊 Message Stats:
📝 Text: ${stats.text}
📷 Photo: ${stats.photo}
🎥 Video: ${stats.video}
📎 Document: ${stats.document}
🎤 Voice: ${stats.voice}
🧩 Sticker: ${stats.sticker}
📍 Location: ${stats.location}
📈 Total: ${stats.total}
`;
  ctx.reply(message);
});

// Anonymous Chat: Join queue
bot.command('chat', async (ctx) => {
  const userId = String(ctx.from.id);
  if (bannedUsers.has(userId)) return ctx.reply("⛔ You are banned.");

  if (activePairs.has(userId)) {
    return ctx.reply("💬 You are already chatting. Use /end to stop.");
  }

  if (waitingUsers.includes(userId)) {
    return ctx.reply("⏳ Already waiting for a partner...");
  }

  if (waitingUsers.length > 0) {
    const partnerId = waitingUsers.shift();
    activePairs.set(userId, partnerId);
    activePairs.set(partnerId, userId);
    await ctx.telegram.sendMessage(partnerId, "🔗 Connected! Start chatting anonymously.");
    await ctx.telegram.sendMessage(userId, "🔗 Connected! Start chatting anonymously.");
  } else {
    waitingUsers.push(userId);
    await ctx.reply("⏳ Waiting for a partner...");
  }
});

// End anonymous chat
bot.command('end', async (ctx) => {
  const userId = String(ctx.from.id);
  if (!activePairs.has(userId)) return ctx.reply("❌ You are not in a chat.");
  const partnerId = activePairs.get(userId);
  activePairs.delete(userId);
  activePairs.delete(partnerId);
  await ctx.telegram.sendMessage(partnerId, "❌ Chat ended by partner.");
  await ctx.telegram.sendMessage(userId, "✅ You have ended the chat.");
});

// Report user
bot.command('report', async (ctx) => {
  const reporterId = String(ctx.from.id);
  if (!activePairs.has(reporterId)) return ctx.reply("⚠️ Not in a chat.");
  const reportedId = activePairs.get(reporterId);
  activePairs.delete(reporterId);
  activePairs.delete(reportedId);
  await ctx.telegram.sendMessage(reportedId, "🚫 You were reported. Chat ended.");
  await ctx.reply("🚨 Report submitted. Admin will review.");
  await ctx.telegram.sendMessage(ADMIN_ID,
    `🚨 *Report Received!*\n👤 Reporter ID: ${reporterId}\n👤 Reported User: ${reportedId}\nUse /ban ${reportedId} to block.`,
    { parse_mode: 'Markdown' });
});

// Ban user (admin only)
bot.command('ban', (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) return;
  const parts = ctx.message.text.split(' ');
  const toBan = parts[1];
  if (!toBan) return ctx.reply("❌ Use: /ban <user_id>");
  bannedUsers.add(toBan);
  ctx.reply(`✅ User ${toBan} banned.`);
});

// Message handler
bot.on('message', async (ctx) => {
  const sender = ctx.from;
  const senderId = String(sender.id);
  const senderName = sender.username
    ? `@${sender.username}`
    : `${sender.first_name || 'Unknown'}`;
  const header = `👤 Name: ${senderName}\n🆔 ID: ${senderId}`;

  if (bannedUsers.has(senderId)) return ctx.reply("⛔ You are banned.");

  // Anonymous chat
  if (activePairs.has(senderId)) {
    const partnerId = activePairs.get(senderId);
    if (ctx.message.text) {
      await ctx.telegram.sendMessage(partnerId, `👤 Stranger: ${ctx.message.text}`);
    } else if (ctx.message.sticker) {
      await ctx.telegram.sendSticker(partnerId, ctx.message.sticker.file_id);
    } else if (ctx.message.photo) {
      await ctx.telegram.sendPhoto(partnerId, ctx.message.photo.at(-1).file_id, {
        caption: ctx.message.caption || ''
      });
    } else {
      await ctx.telegram.sendMessage(partnerId, "🔄 Stranger sent something.");
    }
    return;
  }

  // Forward all types to channel
  try {
    if (ctx.message.text) {
      stats.text++;
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}\n📝 Text:\n${ctx.message.text}`);
    } else if (ctx.message.photo) {
      stats.photo++;
      const photo = ctx.message.photo.at(-1).file_id;
      await ctx.telegram.sendPhoto(CHANNEL_ID, photo, {
        caption: `${header}\n📷 Photo: ${ctx.message.caption || ''}`
      });
    } else if (ctx.message.video) {
      stats.video++;
      await ctx.telegram.sendVideo(CHANNEL_ID, ctx.message.video.file_id, {
        caption: `${header}\n🎥 Video`
      });
    } else if (ctx.message.document) {
      stats.document++;
      await ctx.telegram.sendDocument(CHANNEL_ID, ctx.message.document.file_id, {
        caption: `${header}\n📎 Document`
      });
    } else if (ctx.message.voice) {
      stats.voice++;
      await ctx.telegram.sendVoice(CHANNEL_ID, ctx.message.voice.file_id);
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}\n🎤 Voice Message`);
    } else if (ctx.message.sticker) {
      stats.sticker++;
      await ctx.telegram.sendSticker(CHANNEL_ID, ctx.message.sticker.file_id);
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}\n🧩 Sticker`);
    } else if (ctx.message.location) {
      stats.location++;
      const loc = ctx.message.location;
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}\n📍 Location:\nLat: ${loc.latitude}\nLng: ${loc.longitude}`);
    } else {
      await ctx.telegram.sendMessage(CHANNEL_ID, `${header}\n⚠️ Unsupported message type.`);
    }

    stats.total++;
    await ctx.reply("");
  } catch (err) {
    console.error("Forwarding error:", err);
    await ctx.reply("");
  }
});

// Webhook for Vercel
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (e) {
      console.error("Webhook error:", e);
    }
    res.status(200).send('OK');
  } else {
    res.status(200).send('🤖 Bot is online.');
  }
}
