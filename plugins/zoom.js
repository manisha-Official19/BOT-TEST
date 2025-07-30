const axios = require("axios");
const { cmd } = require('../command');

const zoomReplyMap = {}; // Tracks replies per user

// Zoom.lk Search Command
cmd({
  pattern: "zoom",
  react: "🔍",
  desc: "Search Zoom.lk movies and get download links",
  category: "download",
  use: "zoom <search term>",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    if (!args.length) return reply("❗ Please provide a search term. Example: `zoom spiderman`");

    const searchText = encodeURIComponent(args.join(" "));
    const apiURL = `https://nethu-api-ashy.vercel.app/movie/zoom/search?text=${searchText}`;
    const { data } = await axios.get(apiURL);

    if (!data.status || !data.result?.data?.length) {
      return reply("❌ No results found for your search.");
    }

    const movies = data.result.data;
    let msgText = `🎬 *Search Results for:* "${args.join(" ")}"\n\n`;

    movies.forEach((movie, i) => {
      msgText += `*${i + 1}.* ${movie.title}\n`;
      msgText += `${movie.desc.trim().slice(0, 100)}...\n`;
      msgText += `🔗 ${movie.link}\n\n`;
    });

    msgText += `📩 *Reply to this message with the movie number (1–${movies.length}) to get the download link.*`;

    const sent = await conn.sendMessage(from, { text: msgText }, { quoted: m });

    // Save expected reply info
    zoomReplyMap[m.sender] = {
      stanzaId: sent.key.id,
      movies,
      timeout: setTimeout(() => {
        delete zoomReplyMap[m.sender];
      }, 60000) // 1-minute timeout
    };

  } catch (err) {
    console.error("Zoom Command Error:", err);
    reply("❌ An error occurred. Please try again later.");
  }
});

// Message Reply Handler
cmd.onMessage = async (conn, msg) => {
  try {
    if (!msg || msg.key.fromMe || !msg.message) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    const replyText = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    const replyInfo = msg.message?.extendedTextMessage?.contextInfo;

    if (!replyInfo || !replyText || !zoomReplyMap[sender]) return;

    const expected = zoomReplyMap[sender];
    if (replyInfo.stanzaId !== expected.stanzaId) return;

    const number = parseInt(replyText.trim());
    if (isNaN(number) || number < 1 || number > expected.movies.length) {
      return conn.sendMessage(msg.key.remoteJid, { text: `❗ Please reply with a number between 1 and ${expected.movies.length}.` }, { quoted: msg });
    }

    const selectedMovie = expected.movies[number - 1];
    const downloadURL = `https://nethu-api-ashy.vercel.app/movie/zoom/movie?url=${encodeURIComponent(selectedMovie.link)}`;

    const { data } = await axios.get(downloadURL);
    if (!data.status) {
      return conn.sendMessage(msg.key.remoteJid, { text: "❌ Could not retrieve download info." }, { quoted: msg });
    }

    const dl = data.result;

    let dlMsg = `🎬 *${dl.title}*\n\n`;
    dlMsg += `📦 Size: ${dl.size}\n`;
    dlMsg += `👤 Author: ${dl.author}\n`;
    dlMsg += `👁️ Views: ${dl.view}\n`;
    dlMsg += `📥 Download Link: ${dl.dl_link}`;

    await conn.sendMessage(msg.key.remoteJid, { text: dlMsg }, { quoted: msg });

    clearTimeout(expected.timeout);
    delete zoomReplyMap[sender];

  } catch (err) {
    console.error("Zoom reply handler error:", err);
  }
};
