const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceNotEnabled = require('../../utils/BotConfig/replyServiceNotEnabled');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the discord server or check kicks (not multi-guilded)")
        .addSubcommand(sub =>
            sub.setName("user")
                .setDescription("Kick a user from the discord server.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("User to be kicked.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for the kick.")
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName("check")
                .setDescription("View all kicks from the database.")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],

    run: async (client, interaction) => {
        const { options, guild, member } = interaction;
        const subcommand = options.getSubcommand();

        const config = await BotConfig.findOne({ GuildID: guild.id });
        const serviceConfig = config?.services?.kick;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "kick");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "kick");

        if (subcommand === "user") {
            const embed = new EmbedBuilder()
                .setColor("Red")
                .setDescription("`❌` Kicking via bot is disabled. Please use the Discord client to kick users.")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "check") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const kicks = serviceConfig?.Kicks || [];

            let description = "";

            if (kicks.length) {
                description += "**Kicks in database:**\n";
                description += kicks.map(k =>
                    `• <@${k.UserID}> | By: <@${k.KickedBy}> | Reason: ${k.Reason || "No reason"} | At: <t:${Math.floor(new Date(k.Date).getTime() / 1000)}:f>`
                ).join("\n");
            } else {
                description = "No kicks found in the database.";
            }

            const kicksEmbed = new EmbedBuilder()
                .setTitle("Kicked Users")
                .setColor(0xc72c3b)
                .setDescription(description);

            return interaction.editReply({ embeds: [kicksEmbed] });
        }
    }
}