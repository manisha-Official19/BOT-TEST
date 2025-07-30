const axios = require("axios");  
const fs = require("fs");  
const path = require("path");  
const { cmd, commands } = require('../command')
  
cmd({  
  pattern: "an1apk"
  react: "📦",  
  desc: "Search and get APK details and download link from an1.com",  
  category: "download",  
  use: ".apk <app name>",  
  filename: __filename  
}, async (conn, m, store, { from, args, reply }) => {  
  if (!args.length) return reply("❌ Please provide an app name to search. Example: .apk whatsapp");  
  
  try {  
    const query = args.join(" ");  
    const apiUrl = `https://delirius-apiofc.vercel.app/search/ani1?query=${encodeURIComponent(query)}`;  
  
    const { data } = await axios.get(apiUrl);  
  
    if (!data?.status || !Array.isArray(data.data) || data.data.length === 0) {  
      return reply(`❌ No APK found for "${query}".`);  
    }  
  
    const apk = data.data[0];  
    const downloadUrl = apk.download;  
  
    // Check if the download URL ends with .apk  
    if (!downloadUrl || !downloadUrl.endsWith(".apk")) {  
      return reply("⚠️ Download URL is not a direct APK file. Cannot download automatically.");  
    }  
  
    // Temp file path  
    const filePath = path.join(__dirname, `${apk.name.replace(/\s+/g, "_")}.apk`);  
  
    const writer = fs.createWriteStream(filePath);  
    const response = await axios({  
      url: downloadUrl,  
      method: "GET",  
      responseType: "stream"  
    });  
  
    response.data.pipe(writer);  
  
    // Wait for download to finish  
    await new Promise((resolve, reject) => {  
      writer.on("finish", resolve);  
      writer.on("error", reject);  
    });  
  
    const caption =   
`📦 *${apk.name}* (v${apk.version})  
👤 Developer: ${apk.developer}  
📱 System: ${apk.system}  
⭐ Rating: ${apk.rating} (${apk.vote} votes)  
💾 Size: ${apk.size}  
  
📝 Description:  
${apk.description}  
  
🔗 [Download APK](${apk.download})  
🔗 [More Info](${apk.link})`;  
  
    await conn.sendMessage(from, {  
      image: { url: apk.image },  
      caption  
    }, { quoted: m });  
  
    // Send APK file as document  
    await conn.sendMessage(from, {  
      document: fs.readFileSync(filePath), // use file buffer to send file from local storage  
      mimetype: "application/vnd.android.package-archive",  
      fileName: `${apk.name}_v${apk.version}.apk`  
    }, { quoted: m });  
  
    // Delete temp file  
    fs.unlink(filePath, (err) => {  
      if (err) console.error("Failed to delete temp APK file:", err);  
    });  
  
  } catch (error) {  
    console.error("APK Command Error:", error);  
    reply("❌ Error fetching APK details. Please try again later.");  
  }  
});