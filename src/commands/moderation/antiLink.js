const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Client, ChatInputCommandInteraction, MessageFlags } = require("discord.js");
const antiLinkWL = require("../../schemas/antiLinkWL");
const botConfigCache = require("../../utils/BotConfig/botConfigCache");
const buttonPagination = require("../../utils/buttonPagination");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("anti-link")
        .setDescription("Setup or disable the anti-link system")
        .addSubcommand(subcommand =>
            subcommand.setName("check")
                .setDescription("Check the status of the anti-link system")
        )
        .addSubcommand(subcommand =>
            subcommand.setName("whitelist")
                .setDescription("Allow a user to bypass anti-link system")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user that you want to whitelist")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("unwhitelist")
                .setDescription("Deny a user to bypass anti-link system")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user that you want to unwhitelist")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("checkwhitelist")
                .setDescription("Show all users whitelisted for the anti-link system")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageGuild],
    botPermissions: [PermissionFlagsBits.ManageGuild],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    run: async (client, interaction) => {
        let data, embed, user;
        const { options } = interaction;

        const sub = options.getSubcommand();

        switch (sub) {
            case "check":
                const config = await botConfigCache.getConfig(interaction.guild.id);
                const serviceConfig = config?.services?.antilink;

                if (!serviceConfig) return await replyNoConfigFound(interaction, "antilink");

                if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "antilink", "enabled", false);

                const permissions = serviceConfig.Permissions;

                if (!permissions) return await interaction.reply({ content: "\`⚠️\` No bypass permission is set for the anti-link system.", flags: MessageFlags.Ephemeral });

                return await interaction.reply({ content: `\`✅\` The anti-link system is enabled. People with the **${permissions}** permission can bypass the system.`, flags: MessageFlags.Ephemeral });
            case "whitelist":
                user = options.getUser("user");

                data = await antiLinkWL.findOne({ Guild: interaction.guild.id, UserID: user.id });

                if (data) return await interaction.reply({ content: `\`✅\` ${user} is already whitelisted for bypassing the anti-link system`, flags: MessageFlags.Ephemeral });

                await antiLinkWL.create({
                    Guild: interaction.guild.id,
                    UserID: user.id,
                    WhitelistedBy: interaction.user.id,
                })

                embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`\`🙋‍♂️\` ${user} has been whitelisted for bypassing the anti-link system`)

                return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            case "unwhitelist":
                user = options.getUser("user");
                data = await antiLinkWL.findOne({ Guild: interaction.guild.id, UserID: user.id });

                if (!data) return await interaction.reply({ content: `\`❌\` ${user} is already not whitelisted for bypassing the anti-link system`, flags: MessageFlags.Ephemeral });

                await antiLinkWL.findOneAndDelete({ Guild: interaction.guild.id, UserID: user.id })

                embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`\`✅\` ${user} has been unwhitelisted for bypassing the anti-link system`)

                return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            case "checkwhitelist": {
                const whitelist = await antiLinkWL.find({ Guild: interaction.guild.id });
                if (!whitelist || whitelist.length === 0) {
                    return await interaction.reply({ content: "\`🚫\` No users are currently whitelisted for the anti-link system.", flags: MessageFlags.Ephemeral });
                }

                const pageSize = 20;
                const pages = [];
                for (let i = 0; i < whitelist.length; i += pageSize) {
                    const chunk = whitelist.slice(i, i + pageSize);
                    const userMentions = chunk.map(entry => `<@${entry.UserID}>`).join("\n");

                    const embed = new EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("Whitelisted Users")
                        .setDescription(userMentions);

                    pages.push(embed);
                }

                await buttonPagination(interaction, pages, 60_000); // 60 seconds of timeout
                break;
            }
        }
    }
}