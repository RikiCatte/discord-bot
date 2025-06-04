const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require("discord.js");
const invitesystemSchema = require("../../schemas/invitesSetup");
const inviteSchema = require("../../schemas/invite");
const mConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invitesystem")
        .setDescription("An advanced invite system.")
        .addSubcommand((s) => s
            .setName("configure")
            .setDescription("Configures the advanced invite system.")
            .addChannelOption((o) => o
                .setName("channel")
                .setDescription("The channel to track invites in.")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand((s) => s
            .setName("delete")
            .setDescription("Deletes an invite from a user.")
            .addStringOption((o) => o
                .setName("code")
                .setDescription("The invite code to delete.")
                .setRequired(true)
            )
        )
        .addSubcommand((s) => s
            .setName("reset")
            .setDescription("Resets the invite from a user.")
            .addUserOption((o) => o
                .setName("user")
                .setDescription("The user to reset their invites.")
                .setRequired(true)
            )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageGuild],
    botPermissions: [PermissionFlagsBits.ManageGuild],

    run: async (client, interaction) => {
        const { guild, guildId, options } = interaction;
        const subcommand = options.getSubcommand();
        const member = options.getMember("user");
        const code = options.getString("code");

        let setupData = await invitesystemSchema.findOne({ Guild: guildId });
        const rEmbed = new EmbedBuilder();

        if (subcommand !== "configure" && !setupData) {
            rEmbed
                .setColor(mConfig.embedColorError)
                .setDescription("`❌` The system is not yet set up. Use `/invites configure` to configure it.");

            return interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
        }

        try {
            switch (subcommand) {
                case "configure": {
                    const channel = options.getChannel("channel");
                    if (setupData) {
                        await invitesystemSchema.findOneAndUpdate({ GuildID: guildId }, { ChannelID: channel.id });

                        return interaction.reply({ content: `\`⚠️\` The invite tracker has been changed. Invites will now be tracked in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
                    } else {
                        setupData = new invitesystemSchema({ GuildID: guildId, ChannelID: channel.id });
                        await setupData.save();

                        return interaction.reply({ content: `\`✅\` The invite tracker has been set up. Invites will now be tracked in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
                    }
                }
                case "delete": {
                    const invite = await guild.invites.fetch(code);
                    await invite.delete();

                    rEmbed
                        .setColor(mConfig.embedColorSuccess)
                        .setTitle("Code Removed")
                        .setDescription(`\`✅\` The invite code \`${code}\` has been removed.`);

                    await interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                    break;
                }
                case "reset": {
                    await inviteSchema.updateOne({ GuildID: guildId, UserID: member.id },
                        { $set: { TotalInvites: 0, InvitedUsers: [] } },
                        { upsert: true }
                    );

                    rEmbed
                        .setColor("#FFFFFF")
                        .setTitle("Invites Reset")
                        .setDescription(`\`🗑️\` The invite count for ${member.user.username} has been reset.`)
                        .setTimestamp();

                    await interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                    break;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}