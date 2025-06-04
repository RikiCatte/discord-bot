const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const buttonPagination = require("../../utils/buttonPagination");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get help with bot commands"),

    run: async (client, interaction) => {
        try {
            const commandsPath = path.join(__dirname, "..");
            const commandFolders = fs.readdirSync(commandsPath);
            const helpEmbeds = [];

            for (const folder of commandFolders) {
                const folderPath = path.join(commandsPath, folder);
                if (!fs.statSync(folderPath).isDirectory()) continue;

                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

                let fields = [];
                const subcommands = [];

                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    let command;
                    try {
                        command = require(filePath);
                    } catch (err) {
                        continue; // Salta file non validi
                    }

                    if (command.disabled || command.deleted) continue;

                    const description = command.data?.description || "No description provided";

                    if (command.data?.type === "SUB_COMMAND" || command.data?.type === "SUB_COMMAND_GROUP") {
                        subcommands.push(command);
                    } else if (command.data?.name) {
                        fields.push({
                            name: `/${command.data.name}`,
                            value: `${description}`
                        });
                    }
                }

                // Aggiungi subcommands come campo unico
                if (subcommands.length > 0) {
                    fields.push({
                        name: "Subcommands",
                        value: subcommands.map(subcommand => `/${subcommand.data.name}`).join("\n")
                    });
                }

                // Spezza i campi in più embed se superano 25
                for (let i = 0; i < fields.length; i += 25) {
                    const categoryEmbed = new EmbedBuilder()
                        .setTitle(folder)
                        .setFooter({
                            text: `${msgConfig.footer_text}`,
                            iconURL: `${msgConfig.footer_iconURL}`
                        })
                        .setTimestamp()
                        .setThumbnail(client.user.displayAvatarURL())
                        .addFields(fields.slice(i, i + 25));

                    helpEmbeds.push(categoryEmbed);
                }
            }

            if (helpEmbeds.length === 0) {
                return interaction.reply({ content: "No commands have been found.", flags: MessageFlags.Ephemeral });
            }

            await buttonPagination(interaction, helpEmbeds);
        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "An error occurred, please contact DEVs", flags: MessageFlags.Ephemeral });
        }
    }
}