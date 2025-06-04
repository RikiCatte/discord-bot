const Discord = require('discord.js');
require("colors");
const mongoose = require("mongoose");
const mongoURI = process.env.MONGODB_TOKEN;

module.exports = async (client) => {
    if (!mongoURI) return;
    mongoose.set("strictQuery", true);

    if (await mongoose.connect(mongoURI)) {
        console.log(`[INFO] Connected to the MongoDB database.`.green);
    }

    console.log(`[INFO] Discord.js Version: ${Discord.version}`.blue);
};
