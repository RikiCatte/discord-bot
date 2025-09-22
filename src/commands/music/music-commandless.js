const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");
const { replyNoConfigFound, replyServiceNotEnabled, updateServiceConfig } = require("../../utils/BotConfig");
const MusicEmbed = require("../../utils/music/musicEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music-commandless')
        .setDescription('Setup or reset the commandless music system in your server.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the commandless music system in your server.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset the commandless music system configuration in your server.')
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages],

    run: async (client, interaction) => {
        const { guild } = interaction;


        const config = await BotConfig.findOne({ GuildID: guild.id });
        const serviceConfig = config.services?.music;
        if (!config) return await replyNoConfigFound(interaction, "music");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "music");
        if (!serviceConfig.VoiceChannelID) return await interaction.reply({ content: "`⚠️` You have not specified in which channel the commandless music system should be set up. Please run `/bot-set-service` `music` `edit` to configure it and then run again this command.", flags: MessageFlags.Ephemeral });
        if (!serviceConfig.DJRoleID) return await interaction.reply({ content: "`⚠️` You have not specified a DJ role. Please run `/bot-set-service` `music` `edit` to configure it and then run again this command.", flags: MessageFlags.Ephemeral });

        if (interaction.options.getSubcommand() === "setup") {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                if (serviceConfig.EmbedChannelID && serviceConfig.EmbedMessageID) return await interaction.editReply({ content: "`⚠️` The commandless music system is already set up in this server. If you want to reconfigure it, please delete the existing embed message or reset the music service configuration and then run this command again.", flags: MessageFlags.Ephemeral });

                const bot = guild.members.me;
                const channel = interaction.channel;

                if (!channel.permissionsFor(bot).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages])) return await interaction.editReply({ content: "`❌` I need `Send Messages`, `Embed Links`, and `Manage Messages` permissions in this channel to set up the commandless music system. Please adjust my permissions and try again.", flags: MessageFlags.Ephemeral });

                const musicHandler = new MusicEmbed(client, guild);
                const embedMessage = await musicHandler.createMusicEmbed(interaction.channel.id, guild.id);

                if (!embedMessage) return await interaction.editReply({ content: "`❌` An error occurred while creating the music embed message. Please try again later.", flags: MessageFlags.Ephemeral });

                // Save the embed message and channel IDs to the database
                serviceConfig.EmbedChannelID = embedMessage.channel.id;
                serviceConfig.EmbedMessageID = embedMessage.id;
                await updateServiceConfig(config, "music", { EmbedChannelID: embedMessage.channel.id, EmbedMessageID: embedMessage.id });

                const successEmbed = new EmbedBuilder()
                    .setTitle("`✅` Commandless Music System Setup Complete")
                    .setDescription(`The commandless music system has been successfully set up in <#${serviceConfig.EmbedChannelID}>.`)
                    .addFields(
                        { name: "`📢` Channel", value: `<#${serviceConfig.VoiceChannelID}>`, inline: true },
                        { name: "`🎵` DJ Role", value: `<@&${serviceConfig.DJRoleID}>`, inline: true }
                    )
                    .setColor("Green")
                    .setFooter({ text: "Users can now enjoy commandless music playback!", iconURL: msgConfig.footer_iconURL });

                await interaction.editReply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });

                setTimeout(async () => {
                    try {
                        const usageEmbed = new EmbedBuilder()
                            .setTitle("`🎵` Commandless Music System Active")
                            .setDescription(
                                "- Type a **play song name** to play music!\n" +
                                "- Youtube, Spotify and SoundCloud tracks/playlist links are supported.\n" +
                                "- Other messages will be ignored.\n" +
                                "- Use normal commands (`/play`, `/pause`, `/skip`) here or in other channels.\n\n" +
                                "- This message will auto-deleted in 20 seconds!"
                            )
                            .setColor("Blue")
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        const msg = await channel.send({ embeds: [usageEmbed] });

                        setTimeout(() => {
                            if (msg.deletable) msg.delete().catch(() => { });
                        }, 20_000);
                    } catch (error) {
                        console.error("Error sending usage instructions:", error);
                    }
                }, 2_000);
            } catch (error) {
                console.error("Error in /music-commandless-setup:", error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: "`❌` An unexpected error occurred while setting up the commandless music system. Please try again later.", flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: "`❌` An unexpected error occurred while setting up the commandless music system. Please try again later.", flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.options.getSubcommand() === "reset") {
            try {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                if (!serviceConfig.EmbedChannelID || !serviceConfig.EmbedMessageID) return await interaction.editReply({ content: "`⚠️` The commandless music system is not set up in this server. You can set it up by running `/music-commandless-setup`.", flags: MessageFlags.Ephemeral });

                try {
                    const channel = await client.channels.fetch(serviceConfig.EmbedChannelID);
                    const message = await channel?.messages.fetch(serviceConfig.EmbedMessageID);
                    if (message && message.deletable) await message?.delete();
                } catch (error) {
                    console.log("Error deleting message: ", error);
                }

                serviceConfig.EmbedChannelID = null;
                serviceConfig.EmbedMessageID = null;
                await updateServiceConfig(config, "music", { EmbedChannelID: null, EmbedMessageID: null });

                const embed = new EmbedBuilder()
                    .setTitle("`✅` Commandless Music System Reset")
                    .setDescription("The commandless music system has been disabled and the embed message removed. You can set it up again by running `/music-commandless-setup`.")
                    .setColor("Green")
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error("Error in /music-commandless-reset:", error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: "`❌` An unexpected error occurred while resetting the commandless music system configuration. Please try again later.", flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: "`❌` An unexpected error occurred while resetting the commandless music system configuration. Please try again later.", flags: MessageFlags.Ephemeral });
                }
            }
        }
    }
}
