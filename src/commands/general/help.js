const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { buttonPagination } = require("../../utils/utils.js");
const msgConfig = require("../../messageConfig.json");
const fs = require("fs");
const path = require("path");

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

                let description = "";
                const subcommands = [];

                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    let command;
                    try {
                        command = require(filePath);
                    } catch (err) {
                        continue;
                    }

                    if (command.disabled || command.deleted) continue;

                    const cmdName = command.data?.name ? `/${command.data.name}` : "Unknown";
                    const cmdDescription = command.data?.description || "No description provided";

                    if (command.data?.type === "SUB_COMMAND" || command.data?.type === "SUB_COMMAND_GROUP") subcommands.push(command);
                    else if (command.data?.name) description += `- \`${cmdName}\` - ${cmdDescription}\n`;
                }

                if (subcommands.length > 0) {
                    description += `\n**Subcommands:**\n`;
                    description += subcommands.map(subcommand => `- \`/${subcommand.data.name}\``).join("\n");
                    description += "\n";
                }

                for (let i = 0; i < description.length; i += 4096) {
                    const categoryEmbed = new EmbedBuilder()
                        .setTitle(`\`📖\` ${folder} - Command List (${commandFiles.length})`)
                        .setColor("#0b7e33")
                        .setDescription(description.slice(i, i + 4096))
                        .setFooter({
                            text: `${msgConfig.footer_text}`,
                            iconURL: `${msgConfig.footer_iconURL}`
                        })
                        .setTimestamp()
                        .setThumbnail(client.user.displayAvatarURL());

                    helpEmbeds.push(categoryEmbed);
                }
            }

            if (helpEmbeds.length === 0) return interaction.reply({ content: "No commands have been found.", flags: MessageFlags.Ephemeral });

            await buttonPagination(interaction, helpEmbeds);
        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "An error occurred, please contact DEVs", flags: MessageFlags.Ephemeral });
        }
    }
}