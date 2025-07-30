const axios = require("axios");
const { cmd } = require("../command");

cmd({
  pattern: "zoom",
  react: "🔍",
  desc: "Search Zoom.lk movies and get download links",
  category: "download",
  use: "zoom <movie name>",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    if (!args.length) return reply("❗ Please provide a search term.\nExample: `zoom Avatar`");

    const searchText = encodeURIComponent(args.join(" "));
    const searchApiUrl = `https://nethu-api-ashy.vercel.app/movie/zoom/search?text=${searchText}`;

    const searchResponse = await axios.get(searchApiUrl);
    const result = searchResponse.data;

    if (!result.status || !result.result.data.length) {
      return reply("❌ No movies found for your search.");
    }

    const firstMovie = result.result.data[0];

    // Now fetch the download link for the top result
    const downloadUrlApi = `https://nethu-api-ashy.vercel.app/movie/zoom/movie?url=${encodeURIComponent(firstMovie.link)}`;
    const downloadResponse = await axios.get(downloadUrlApi);

    if (!downloadResponse.data.status) return reply("⚠️ Download details not available.");

    const dl = downloadResponse.data.result;

    let downloadMsg = `🎬 *${dl.title}*\n\n`;
    downloadMsg += `📦 Size: ${dl.size}\n`;
    downloadMsg += `👤 Author: ${dl.author}\n`;
    downloadMsg += `👁️ Views: ${dl.view}\n`;
    downloadMsg += `🔗 Download Link: ${dl.dl_link}`;

    await reply(downloadMsg);
  } catch (err) {
    console.error(err);
    reply("⚠️ Error occurred while processing your request. Try again later.");
  }
});
