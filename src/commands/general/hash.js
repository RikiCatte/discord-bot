const crypto = require('crypto');
const { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");

async function generateHash(input, algorithm = 'sha512', salt = "") {
    if (salt != "")
        return crypto.createHash(algorithm).update(input + salt).digest('hex');
    else
        return crypto.createHash(algorithm).update(input).digest('hex');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hash")
        .setDescription("Get the hash code of a string")
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text to hash")
                .setMaxLength(50)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("algorithm")
                .setDescription("Choose the hash algorithm to use, default is SHA-512")
                .addChoices(
                    { name: "MD5", value: "md5" },
                    { name: "SHA-1", value: "sha1" },
                    { name: "SHA-256", value: "sha256" },
                    { name: "SHA-384", value: "sha384" },
                    { name: "SHA-512", value: "sha512" },
                )
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("salt")
                .setDescription("Add a salt to the hash, default is none")
                .setRequired(false)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const { options } = interaction;

        const text = options.getString("text");
        let algo = options.getString("algorithm");
        const salt = options.getString("salt");

        if (!algo) algo = "sha512";

        const hashedText = await generateHash(text, algo, salt);
        await interaction.reply({ content: `Your hashed text is ${hashedText}`, ephemeral: true });
    }
};