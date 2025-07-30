const { cmd, commands } = require('../command')
cmd({
  pattern: "menu",
  alias: ["panel"],
  desc: "Get Bot Menu",
  category: "main",
  react: "📁",
  filename: __filename
}, async (
  conn, mek, m,
  {
    from, quoted, body, isCmd, command, args, q,
    isGroup, sender, senderNumber, botNumber2,
    botNumber, pushname, isMe, isOwner, groupMetadata,
    groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply
  }
) => {
  try {
    // Initialize menu categories
    let menu = {
      main: "",
      download: "",
      movie: "",
      group: "",
      owner: "",
      convert: "",
      news: "",
      ai: "",
      tools: "",
      search: "",
      fun: "",
      voice: "",
      other: ""
    };

    // Loop through all commands and sort them into categories
    for (let i = 0; i < commands.length; i++) {
      let cmd = commands[i];
      if (cmd.pattern && !cmd.dontAddCommandList) {
        let category = (cmd.category || "other").toLowerCase();
        if (!menu[category]) menu[category] = ""; // fallback
        menu[category] += `● .${cmd.pattern}\n`;
      }
    }

    // Format final menu
    let finalMenu = `╭───『 *📁 BOT MENU* 』───⬣\n│\n`;
    for (let cat in menu) {
      if (menu[cat].trim()) {
        finalMenu += `├── *${cat.toUpperCase()}*\n${menu[cat]}\n`;
      }
    }
    finalMenu += `╰────────────⬣`;

    // Send the menu to the user
    await reply(finalMenu);
  } catch (err) {
    console.error("❌ Menu Error:", err);
    await reply("❌ Error generating menu.");
  }
});