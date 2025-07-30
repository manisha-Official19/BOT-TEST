const axios = require("axios");
const { cmd, commands } = require('../command')

// A simple in-memory store to keep track of ongoing quizzes per chat
const ongoingQuizzes = new Map();

cmd({
  pattern: "quiz",
  alias: ["asahotak", "riddle"],
  react: "🧠",
  desc: "Send a brain teaser and check your answer",
  category: "fun",
  use: ".quiz",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    // If user is answering an ongoing quiz:
    if (ongoingQuizzes.has(from)) {
      const correctAnswer = ongoingQuizzes.get(from);
      const userAnswer = m.text.trim().toLowerCase();

      if (userAnswer === correctAnswer.toLowerCase()) {
        await reply("🎉 Correct! Well done.");
      } else {
        await reply(`❌ Wrong answer. The correct answer is:\n*${correctAnswer}*`);
      }
      ongoingQuizzes.delete(from);
      return;
    }

    // Otherwise, send a new question:
    const apiUrl = "https://api.siputzx.my.id/api/games/asahotak";
    const { data } = await axios.get(apiUrl);

    if (data?.status && data?.data) {
      const question = data.data.soal;
      const answer = data.data.jawaban;

      ongoingQuizzes.set(from, answer);

      await conn.sendMessage(from, {
        text: `🧩 *Brain Teaser*\n\n❓ Question:\n${question}\n\n_Reply with your answer to check it!_`
      }, { quoted: m });

      // Optional: clear quiz after 2 minutes to avoid memory leak
      setTimeout(() => ongoingQuizzes.delete(from), 2 * 60 * 1000);

    } else {
      reply("❌ Failed to get a question. Please try again.");
    }
  } catch (error) {
    console.error("Quiz Command Error:", error);
    reply("❌ Error fetching question. Please try again later.");
  }
});