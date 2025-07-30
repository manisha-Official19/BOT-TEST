const axios = require("axios");
const { cmd } = require('../command')

cmd({
  pattern: "zoom",
  react: "🔍",
  desc: "Search Zoom.lk movies and get download links",
  category: "download",
  use: "zoom <search term>",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    if (!args.length) return reply("Please provide a search term, e.g., zoom dragonkeeper");

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
      message += `${movie.desc.trim().slice(0, 100)}...\n`;  // snippet description
      message += `[Link](${movie.link})\n\n`;
    });
    message += "Reply with the number to get the download link.";

    await reply(message, null, { detectLinks: true });

    // Wait for the user to reply with a number between 1 and movies.length
    const filter = (response) => {
      return response.sender === m.sender && /^[1-9]\d*$/.test(response.text) && Number(response.text) >= 1 && Number(response.text) <= movies.length;
    };

    // Wait for reply message from same user (adjust this based on your framework)
    const collected = await conn.waitForReply(m.key.remoteJid, m.sender, filter, 30000);
    if (!collected) return reply("Timeout: You didn't reply with a number in time.");

    const selectedIndex = Number(collected.text) - 1;
    const selectedMovie = movies[selectedIndex];
    if (!selectedMovie) return reply("Invalid selection.");

    // Fetch download info
    const downloadUrlApi = `https://nethu-api-ashy.vercel.app/movie/zoom/movie?url=${encodeURIComponent(selectedMovie.link)}`;

    const downloadResponse = await axios.get(downloadUrlApi);
    if (!downloadResponse.data.status) return reply("Download info not found.");

    const dl = downloadResponse.data.result;

    // Format download info message
    let downloadMsg = `🎬 *${dl.title}*\n\n`;
    downloadMsg += `📦 Size: ${dl.size}\n`;
    downloadMsg += `👤 Author: ${dl.author}\n`;
    downloadMsg += `👁️ Views: ${dl.view}\n`;
    downloadMsg += `🔗 Download Link: ${dl.dl_link}\n`;

    await reply(downloadMsg);

  } catch (error) {
    console.error(error);
    reply("❌ Please try again later.");
  }
});