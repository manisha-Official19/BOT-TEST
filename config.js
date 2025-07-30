const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "9qcVDJIK#yW695R5aFOCHRV0Z4Q69JxY6gltw_hSQl5pmbDfepZU",
    MODE: process.env.MODE || "private",
    PREFIX: process.env.PREFIX || "."
    };
    
