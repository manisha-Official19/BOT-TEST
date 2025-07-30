const axios = require("axios");
const { cmd, commands } = require('../command')

cmd({
  pattern: "news",
  alias: ["breakingnews", "latestnews", "tsunami"],
  react: "📰",
  desc: "Get the latest breaking news.",
  category: "news",
  use: ".news",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    const apiUrl = `https://nethu-api-ashy.vercel.app/news/derana`; // Replace with your actual news API

    const { data } = await axios.get(apiUrl);

    if (data?.status && data?.result) {
      const news = data.result;
      const caption = `📰 *${news.title}*\n\n📅 Date: ${news.date}\n\n📝 Description:\n${news.desc}\n\n🌐 *Read more:* ${news.url}\n\n_Credits: ${data.creator}_`;

      await conn.sendMessage(from, {
        image: { url: news.image },
        caption
      }, { quoted: m });
    } else {
      reply("❌ No news found.");
    }
  } catch (error) {
    console.error("News Error:", error);
    reply("❌ An error occurred while fetching the news. Please try again later.");
  }
});