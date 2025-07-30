const axios = require("axios");
const { cmd, commands } = require('../command')

cmd({
  pattern: "rw",
  alias: ["randomwall", "wallpaper"],
  react: "🌌",
  desc: "Download random wallpapers based on keywords.",
  category: "wallpaper",
  use: ".rw <keyword>",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    const query = args.length ? args.join(" ") : "random";
    const apiUrl = `https://api.giftedtech.web.id/api/search/wallpaper?apikey=gifted&query=${encodeURIComponent(query)}`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data?.status && data?.imgUrl) {
      const caption = `🌌 *Random Wallpaper: ${query}*\n\n_hi_`;
      await conn.sendMessage(from, {
        image: { url: data.imgUrl },
        caption: caption
      }, { quoted: m });
    } else {
      reply(`❌ No wallpaper found for *"${query}"*.`);
    }

  } catch (error) {
    console.error("Wallpaper Error:", error.message || error);
    reply("❌ An error occurred while fetching the wallpaper. Please try again later.");
  }
});