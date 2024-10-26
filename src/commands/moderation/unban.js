const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const mConfig = require("../../messageConfig.json");
const moderationSchema = require("../../schemas/moderation");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Revoke a server ban.")
        .addStringOption((o) => o
            .setName("user_id")
            .setDescription("The id of the user whose ban you want to revoke.")
            .setRequired(true)
        )
        .addStringOption((o) => o
            .setName("reason")
            .setDescription("The reason why you want to unban this user")
            .setRequired(false)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    run: async (client, interaction) => {
        const { options, guildId, guild, member } = interaction;

        const userId = options.getString("user_id");
        const reason = options.getString("reason");

        let data = await moderationSchema.findOne({ GuildID: guildId });
        if (!data) {
            rEmbed
                .setColor(mConfig.embedColorError)
                .setDescription(`\`❌\` This server isn't configured yet.\n\n\`💡\` Use \`/moderatesystem configure\` to start configuring this server`);
            return interaction.reply({ embeds: [rEmbed], ephemeral: true });
        };

        if (userId === member.id) {
            rEmbed
                .setColor(mConfig.embedColorError)
                .setDescription(`${mConfig.unableToInteractWithYourself}`);
            return interaction.reply({ embeds: [rEmbed], ephemeral: true });
        };
        guild.members.unban(userId, reason || "None");

        const rEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorSuccess)
            .setFooter({ text: `${client.user.username} - Unban user` })
            .setDescription(`\`✅\` Successfully revoked the ban of \`${userId}\`.`);

        interaction.reply({ embeds: [rEmbed], ephemeral: true });
    },
};