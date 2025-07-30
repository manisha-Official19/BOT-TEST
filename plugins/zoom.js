const axios = require("axios");
const { cmd } = require("../command"); // Adjust this to your command system

cmd({
  pattern: "zoom",
  react: "🔍",
  desc: "Search movies from Zoom.lk and get download links",
  category: "download",
  use: "zoom <search term>",
  filename: __filename,
}, async (conn, m, store, { from, args, reply }) => {
  try {
    if (!args.length)
      return reply("❗ Please provide a search term. Example: `.zoom avatar`");

    const searchText = encodeURIComponent(args.join(" "));
    const searchApiUrl = `https://nethu-api-ashy.vercel.app/movie/zoom/search?text=${searchText}`;

    const searchResponse = await axios.get(searchApiUrl);
    const result = searchResponse.data;

    if (!result.status || !result.result.data.length) {
      return reply("🔍 No results found for your search.");
    }

    const movies = result.result.data.slice(0, 5); // limit to 5 results

    let fullMessage = `🎬 *Zoom.lk Search Results for:* ${args.join(" ")}\n\n`;

    for (const movie of movies) {
      const downloadApiUrl = `https://nethu-api-ashy.vercel.app/movie/zoom/movie?url=${encodeURIComponent(movie.link)}`;

      const downloadResponse = await axios.get(downloadApiUrl);
      if (!downloadResponse.data.status) continue;

      const dl = downloadResponse.data.result;

      fullMessage += `🔹 *${dl.title}*\n`;
      fullMessage += `📦 Size: ${dl.size}\n`;
      fullMessage += `👤 Author: ${dl.author}\n`;
      fullMessage += `👁️ Views: ${dl.view}\n`;
      fullMessage += `🔗 Download: ${dl.dl_link}\n\n`;
    }

    await conn.sendMessage(m.chat, { text: fullMessage.trim() }, { quoted: m });

  } catch (err) {
    console.error(err);
    reply("❌ An error occurred. Please try again later.");
  }
});
