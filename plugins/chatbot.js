import config from '../config';
import axios from 'axios';
import { cmd } from '../command';

cmd({
  pattern: "chatbot",
  alias: ["ai", "gpt"],
  use: '.chatbot on/off',
  desc: "Toggle the Chatbot system",
  category: "main",
  react: "🤖",
  filename: __filename
},
async (conn, m, { text, prefix, from, sender }) => {
  let resText, status;

  if (text === 'on') {
    config.CHATBOT = true;
    status = "🟢 *Enabled*";
    resText = "🤖 Chatbot is now *enabled*. I’m live!";
  } else if (text === 'off') {
    config.CHATBOT = false;
    status = "🔴 *Disabled*";
    resText = "🔕 Chatbot is now *disabled*. I’ll stay quiet.";
  } else {
    resText = `💡 *Usage:*\n• ${prefix}chatbot on\n• ${prefix}chatbot off`;
    status = config.CHATBOT ? "🟢 *Enabled*" : "🔴 *Disabled*";
  }

  const statusMessage = `
╭─❏ *『 CHATBOT STATUS 』*
│
├─🤖 *Status:* ${status}
├─📅 *Updated At:* ${new Date().toLocaleTimeString()}
│
╰─❏ *Powered by 𝙱.𝙼.𝙱-𝚇𝙼𝙳 🤖*
  `.trim();

  await conn.sendMessage(from, {
    text: statusMessage,
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      mentionedJid: [sender],
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363382023564830@newsletter',
        newsletterName: '𝙱.𝙼.𝙱-𝚃𝙴𝙲𝙷'
      }
    }
  }, { quoted: m });
});

// ─── Background Auto-Responder (Runs for every message) ─────────────────────
cmd({
  pattern: "auto_chat",
  hidden: true,
  type: "plugin",
  onlyInternal: true
},
async (conn, m) => {
  try {
    if (!config.CHATBOT) return;
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const isGroup = from.endsWith('@g.us');
    const msgText = m.body?.trim() || '';

    if (!msgText) return;

    // Group logic – only respond if mentioned, quoted, or replied
    if (isGroup) {
      const ctx = m.message?.extendedTextMessage?.contextInfo || {};
      const mentioned = ctx.mentionedJid?.includes(conn.user.id);
      const quotedYou = ctx.participant === conn.user.id;
      const repliedToYou = ctx.stanzaId && quotedYou;
      if (!mentioned && !quotedYou && !repliedToYou) return;
    }

    global.userChats = global.userChats || {};
    global.userChats[sender] = global.userChats[sender] || [];
    global.userChats[sender].push(`👤 ${msgText}`);
    if (global.userChats[sender].length > 15) global.userChats[sender].shift();

    const prompt = `
You are *Popkid-Gle*, a smart and helpful AI created by Bmb Xmd

🧠 *Conversation History:*
${global.userChats[sender].join('\n')}
    `;

    const { data } = await axios.get("https://mannoffc-x.hf.space/ai/logic", {
      params: { q: msgText, logic: prompt }
    });

    const botReply = data.result || '🤖 Sorry, I didn’t get that.';
    global.userChats[sender].push(`🤖 ${botReply}`);

    await conn.sendMessage(from, {
      text: botReply,
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        mentionedJid: [sender],
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363382023564830@newsletter',
          newsletterName: '𝙱.𝙼.𝙱-𝚇𝙼𝙳'
        }
      }
    }, { quoted: m });

  } catch (err) {
    console.error("Chatbot Error:", err);
  }
});
