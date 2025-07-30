const axios = require("axios");
const { cmd } = require('../command');

cmd({
  pattern: "zoom",
  react: "🔍",
  desc: "Search Zoom.lk movies and get download links",
  category: "download",
  use: "zoom <search term>",
  filename: __filename
}, async (conn, m, store, { from, args, reply, sendMessage, ev }) => {
  try {
    if (!args.length) return reply("Please provide a search term, e.g., zoom deadpool");

    const searchText = encodeURIComponent(args.join(" "));
    const searchApiUrl = `https://nethu-api-ashy.vercel.app/movie/zoom/search?text=${searchText}`;

    // Step 1: Search movies
    const searchRes = await axios.get(searchApiUrl);
    if (!searchRes.data.status || !searchRes.data.result.length) {
      return reply("No movies found for that search term.");
    }

    const movies = searchRes.data.result;

    // Prepare a numbered list of titles to send to user
    let messageText = `Search results for *${args.join(" ")}*:\n\n`;
    movies.forEach((movie, index) => {
      messageText += `*${index + 1}.* ${movie.title}\n`;
    });
    messageText += `\nReply with the number of the movie you want to download.`;

    // Send the list and save the message id for listening replies
    const sentMsg = await sendMessage(from, { text: messageText }, { quoted: m });

    // Step 2: Listen for user's reply to select movie
    const handler = async (update) => {
      const msg = update.messages[0];
      if (!msg.message || !msg.key.remoteJid || msg.key.remoteJid !== from) return;
      if (!msg.message.extendedTextMessage) return;

      // Only proceed if this is a reply to the movie list message
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId === sentMsg.key.id) {
        const choice = msg.message.extendedTextMessage.text.trim();
        const choiceNum = parseInt(choice);
        if (!choiceNum || choiceNum < 1 || choiceNum > movies.length) {
          await sendMessage(from, { text: "Invalid choice. Please reply with a valid number from the list." });
          return;
        }

        const selectedMovie = movies[choiceNum - 1];

        // Step 3: Get movie download info
        const downloadApiUrl = `https://nethu-api-ashy.vercel.app/movie/zoom/movie?url=${encodeURIComponent(selectedMovie.link)}`;
        const dlRes = await axios.get(downloadApiUrl);

        if (!dlRes.data.status || !dlRes.data.result?.dl_link) {
          await sendMessage(from, { text: "Sorry, couldn't get download link for that movie." });
          return;
        }

        const dlInfo = dlRes.data.result;

        // Reply with download details
        let dlMessage = `*${dlInfo.title}*\n`;
        dlMessage += `Author: ${dlInfo.author}\n`;
        dlMessage += `Views: ${dlInfo.view || "N/A"}\n`;
        dlMessage += `Date: ${dlInfo.date || "N/A"}\n`;
        dlMessage += `Size: ${dlInfo.size || "N/A"}\n\n`;
        dlMessage += `Download Link: ${dlInfo.dl_link}`;

        await sendMessage(from, { text: dlMessage });

        // Remove listener after done
        ev.off("messages.upsert", handler);
      }
    };

    // Register listener
    ev.on("messages.upsert", handler);

  } catch (error) {
    console.error(error);
    reply("Error occurred while searching Zoom.lk movies.");
  }
});
