// Enhanced Telegram Bot with Anonymous Chat, Feedback, Bios, and Spam Protection import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN); const CHANNEL_ID = process.env.CHANNEL_ID; const ADMIN_ID = process.env.ADMIN_ID;

const stats = { text: 0, photo: 0, video: 0, document: 0, voice: 0, sticker: 0, location: 0, total: 0 }; const waitingUsers = []; const activePairs = new Map(); const bannedUsers = new Set(); const bios = new Map(); const lastMessageTimes = new Map(); const feedbacks = []; const SPAM_INTERVAL = 1500; // 1.5 seconds cooldown

bot.start((ctx) => { ctx.reply("👋 Welcome! Use /chat to talk anonymously or send me a message to forward to admin."); });

// Bio setting bot.command('setbio', (ctx) => { const bio = ctx.message.text.split(' ').slice(1).join(' '); if (!bio) return ctx.reply("❌ Usage: /setbio <your bio>"); bios.set(ctx.from.id.toString(), bio); ctx.reply("✅ Bio set successfully."); });

bot.command('bio', (ctx) => { const bio = bios.get(ctx.from.id.toString()); if (!bio) return ctx.reply("❌ No bio set. Use /setbio <bio>"); ctx.reply(📜 Your Bio:\n${bio}); });

// Feedback command bot.command('feedback', (ctx) => { const message = ctx.message.text.split(' ').slice(1).join(' '); if (!message) return ctx.reply("❌ Usage: /feedback <your message>"); feedbacks.push({ id: ctx.from.id, name: ctx.from.username || ctx.from.first_name, text: message }); ctx.telegram.sendMessage(ADMIN_ID, 📩 Feedback Received:\nFrom: ${ctx.from.id} (${ctx.from.username || ctx.from.first_name})\nMessage: ${message}); ctx.reply("✅ Feedback sent to admin. Thank you!"); });

// Anonymous chat setup and logic bot.command('chat', async (ctx) => { const userId = ctx.from.id.toString(); if (bannedUsers.has(userId)) return ctx.reply("⛔ You are banned."); if (activePairs.has(userId)) return ctx.reply("💬 You're already chatting. Use /end to stop."); if (waitingUsers.includes(userId)) return ctx.reply("⏳ Waiting for a partner...");

if (waitingUsers.length > 0) { const partnerId = waitingUsers.shift(); activePairs.set(userId, partnerId); activePairs.set(partnerId, userId);

const partnerBio = bios.get(partnerId) ? `📜 Bio: ${bios.get(partnerId)}` : "";
const userBio = bios.get(userId) ? `📜 Bio: ${bios.get(userId)}` : "";

await ctx.telegram.sendMessage(partnerId, `🔗 Connected! Start chatting.\n${userBio}`);
await ctx.telegram.sendMessage(userId, `🔗 Connected! Start chatting.\n${partnerBio}`);

} else { waitingUsers.push(userId); ctx.reply("⏳ Waiting for a partner..."); } });

bot.command('end', async (ctx) => { const userId = ctx.from.id.toString(); const partnerId = activePairs.get(userId); if (!partnerId) return ctx.reply("❌ You're not in a chat."); activePairs.delete(userId); activePairs.delete(partnerId); await ctx.telegram.sendMessage(partnerId, "❌ Your chat was ended by the partner."); await ctx.reply("✅ You have left the chat."); });

// Spam protection function isSpamming(userId) { const now = Date.now(); if (!lastMessageTimes.has(userId)) { lastMessageTimes.set(userId, now); return false; } const lastTime = lastMessageTimes.get(userId); if (now - lastTime < SPAM_INTERVAL) return true; lastMessageTimes.set(userId, now); return false; }

// Message handler with spam check and forwarding bot.on('message', async (ctx) => { const senderId = ctx.from.id.toString(); if (bannedUsers.has(senderId)) return; if (isSpamming(senderId)) return ctx.reply("⚠️ You're sending messages too quickly. Wait a moment.");

const name = ctx.from.username ? @${ctx.from.username} : ctx.from.first_name; const header = 👤 Name: ${name}\n🆔 ID: ${senderId};

if (activePairs.has(senderId)) { const partnerId = activePairs.get(senderId); const forward = (type, data, options) => ctx.telegram[type](partnerId, data, options);

if (ctx.message.text) forward('sendMessage', `👤 Stranger: ${ctx.message.text}`);
else if (ctx.message.photo) forward('sendPhoto', ctx.message.photo.at(-1).file_id, { caption: ctx.message.caption });
else if (ctx.message.sticker) forward('sendSticker', ctx.message.sticker.file_id);
else if (ctx.message.document) forward('sendDocument', ctx.message.document.file_id);
else if (ctx.message.voice) forward('sendVoice', ctx.message.voice.file_id);
else if (ctx.message.video) forward('sendVideo', ctx.message.video.file_id);
else ctx.telegram.sendMessage(partnerId, "📦 Stranger sent a file.");
return;

}

// Forward to admin/channel with full context try { if (ctx.message.text) { stats.text++; await ctx.telegram.sendMessage(CHANNEL_ID, ${header}\n📝 ${ctx.message.text}); } else if (ctx.message.photo) { stats.photo++; await ctx.telegram.sendPhoto(CHANNEL_ID, ctx.message.photo.at(-1).file_id, { caption: ${header}\n📷 ${ctx.message.caption || ''} }); } else if (ctx.message.sticker) { stats.sticker++; await ctx.telegram.sendSticker(CHANNEL_ID, ctx.message.sticker.file_id); await ctx.telegram.sendMessage(CHANNEL_ID, ${header}\n🧩 Sticker); } else if (ctx.message.document) { stats.document++; await ctx.telegram.sendDocument(CHANNEL_ID, ctx.message.document.file_id, { caption: ${header}\n📎 Document }); } else if (ctx.message.voice) { stats.voice++; await ctx.telegram.sendVoice(CHANNEL_ID, ctx.message.voice.file_id); await ctx.telegram.sendMessage(CHANNEL_ID, ${header}\n🎤 Voice); } else { await ctx.telegram.sendMessage(CHANNEL_ID, ${header}\n⚠️ Unknown content type.); } stats.total++; await ctx.reply("✅ Message forwarded."); } catch (e) { console.error("Forward error:", e); } });

// Webhook for Vercel export default async function handler(req, res) { if (req.method === 'POST') { try { await bot.handleUpdate(req.body); } catch (e) { console.error("Webhook error:", e); } res.status(200).send('OK'); } else { res.status(200).send('🤖 Bot is running.'); } }

