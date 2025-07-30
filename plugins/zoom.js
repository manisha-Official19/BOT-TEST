const axios = require("axios");
const { cmd } = require("../command"); // ඔයාගේ command loader අනුව adjust කරන්න

// Cache for storing movies per chat (key = chat id)
const movieCache = new Map();

// To track sent message keys per chat, to check reply stanzaId
const sentMessages = new Map();

cmd({
  pattern: "zoom",
  react: "🔍",
  desc: "Search Zoom.lk movies and get download links",
  category: "download",
  use: "zoom <search term>",
  filename: __filename,
}, async (conn, m, store, { from, args, reply }) => {
  try {
    if (!args.length)
      return reply("Please provide a search term, e.g., zoom dragonkeeper");

    const searchText = encodeURIComponent(args.join(" "));
    const searchapiUrl = `https://nethu-api-ashy.vercel.app/movie/zoom/search?text=${searchText}`;

    const searchResponse = await axios.get(searchapiUrl);
    const result = searchResponse.data;

    if (!result.status || !result.result.data.length) {
      return reply("No results found for your search.");
    }

    const movies = result.result.data;

    let message = `📽️ *Search results for:* ${args.join(" ")}\n\n`;
    movies.forEach((movie, i) => {
      message += `*${i + 1}.* ${movie.title}\n`;
      message += `${movie.desc.trim().slice(0, 100)}...\n`;
      message += `[Link](${movie.link})\n\n`;
    });
    message +=
      "Reply *to this message* with the number to get the download link.";

    // Send message and save sent message key for reply tracking
    const sentMsg = await conn.sendMessage(
      m.chat,
      { text: message, mentions: [m.sender] },
      { quoted: m }
    );

    // Save movies list & sent message key for this chat
    movieCache.set(m.chat, movies);
    sentMessages.set(m.chat, sentMsg);

  } catch (error) {
    console.error(error);
    reply("❌ Please try again later.");
  }
});

// Listen for replies to the sent movie list messages
// messageHandler.ev is your Baileys event emitter for messages
messageHandler.ev.on("messages.upsert", async (update) => {
  try {
    const message = update.messages[0];

    if (
      !message.message ||
      !message.message.extendedTextMessage ||
      !message.key.fromMe // ignore our own messages
    )
      return;

    const replyText = message.message.extendedTextMessage.text.trim();
    const contextInfo = message.message.extendedTextMessage.contextInfo;

    if (!contextInfo) return;

    // Get the original sent message for this chat to check reply stanzaId
    const sentMsg = sentMessages.get(message.key.remoteJid);
    if (!sentMsg) return;

    // Check if this message is a reply to the zoom movie list message
    if (contextInfo.stanzaId !== sentMsg.key.id) return;

    // Get cached movies for this chat
    const movies = movieCache.get(message.key.remoteJid);
    if (!movies) return;

    // Validate user reply number
    const selectedIndex = parseInt(replyText, 10) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= movies.length) {
      await conn.sendMessage(
        message.key.remoteJid,
        { text: "Invalid selection, please reply with a valid number." },
        { quoted: message }
      );
      return;
    }

    const selectedMovie = movies[selectedIndex];

    // Fetch download info
    const downloadUrlApi = `https://nethu-api-ashy.vercel.app/movie/zoom/movie?url=${encodeURIComponent(
      selectedMovie.link
    )}`;

    const downloadResponse = await axios.get(downloadUrlApi);
    if (!downloadResponse.data.status) {
      await conn.sendMessage(
        message.key.remoteJid,
        { text: "Download info not found." },
        { quoted: message }
      );
      return;
    }

    const dl = downloadResponse.data.result;

    let downloadMsg = `🎬 *${dl.title}*\n\n`;
    downloadMsg += `📦 Size: ${dl.size}\n`;
    downloadMsg += `👤 Author: ${dl.author}\n`;
    downloadMsg += `👁️ Views: ${dl.view}\n`;
    downloadMsg += `🔗 Download Link: ${dl.dl_link}\n`;

    await conn.sendMessage(
      message.key.remoteJid,
      { text: downloadMsg },
      { quoted: message }
    );
  } catch (err) {
    console.error(err);
  }
});