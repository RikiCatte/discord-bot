const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, Client, ChatInputCommandInteraction, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const { buttonPagination } = require("../../utils/utils.js");
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
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.antilink;
        if (!serviceConfig) return await replyNoConfigFound(interaction, "antilink");

        let embed, user;
        const { options } = interaction;

        const sub = options.getSubcommand();

        switch (sub) {
            case "check": {
                const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
                const serviceConfig = config?.services?.antilink;

                if (!serviceConfig) return await replyNoConfigFound(interaction, "antilink");
                if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "antilink", "enabled", false);

                const permissions = serviceConfig.Permissions;
                if (!permissions) return await interaction.reply({ content: "\`⚠️\` No bypass permission is set for the anti-link system.", flags: MessageFlags.Ephemeral });

                await interaction.reply({ content: `\`✅\` The anti-link system is enabled. People with the **${permissions}** permission can bypass the system.`, flags: MessageFlags.Ephemeral });

                if (serviceConfig.Whitelist.length > 0) await interaction.followUp({ content: `\`ℹ️\` There are currently **${serviceConfig.Whitelist.length}** users whitelisted for bypassing the anti-link system. Use \`/anti-link checkwhitelist\` to see them.`, flags: MessageFlags.Ephemeral });

                return;
            }
            case "whitelist":
                user = options.getUser("user");

                if (serviceConfig.Whitelist.some(entry => entry.UserID === user.id))
                    return await interaction.reply({ content: `\`✅\` ${user} is already whitelisted for bypassing the anti-link system`, flags: MessageFlags.Ephemeral });

                serviceConfig.Whitelist.push({ UserID: user.id });
                await updateServiceConfig(config, "antilink", { Whitelist: serviceConfig.Whitelist });

                embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`\`🙋‍♂️\` ${user} has been whitelisted for bypassing the anti-link system`)

                return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            case "unwhitelist":
                user = options.getUser("user");

                const index = serviceConfig.Whitelist.findIndex(entry => entry.UserID === user.id);
                if (index === -1)
                    return await interaction.reply({ content: `\`❌\` ${user} is already not whitelisted for bypassing the anti-link system`, flags: MessageFlags.Ephemeral });

                serviceConfig.Whitelist.splice(index, 1);
                await updateServiceConfig(config, "antilink", { Whitelist: serviceConfig.Whitelist });

                embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`\`✅\` ${user} has been unwhitelisted for bypassing the anti-link system`)

                return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            case "checkwhitelist": {
                const whitelist = serviceConfig.Whitelist;
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

                await buttonPagination(interaction, pages, 60_000);
                break;
            }
        }
    }
}