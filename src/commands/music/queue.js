const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Display the current music queue.")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        const { member, guild } = interaction;

        const config = await BotConfig.findOne({ GuildID: guild.id });
        const serviceConfig = config.services?.music;
        if (!config) return await replyNoConfigFound(interaction, "music");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "music");

        const voiceChannel = member.voice.channel;

        const embed = new EmbedBuilder();
        let message;

        if (!voiceChannel) {
            embed
                .setDescription("`⚠️` You must be in a voice channel to execute music commands.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) {
                const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }
            else {
                const { resource } = await interaction.editReply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }

            setTimeout(() => {
                if (message && message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return;
        }

        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed
                .setDescription(`\`⚠️\` You can't use the music player because it's already active in <#${guild.members.me.voice.channelId}>`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) {
                const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }
            else {
                const { resource } = await interaction.editReply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }

            setTimeout(() => {
                if (message && message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return;
        }

        const DJRole = guild.roles.cache.get(serviceConfig.DJRoleID);
        if (DJRole && !interaction.member.roles.cache.has(DJRole.id)) {
            embed
                .setDescription(`\`⚠️\` You need the <@&${DJRole.id}> role to use music commands.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) {
                const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }
            else {
                const { resource } = await interaction.editReply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }

            setTimeout(() => {
                if (message && message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return;
        }

        try {
            const queue = useQueue(interaction.guild);

            if (!queue) {
                embed
                    .setDescription("\`❌\` This server does not have an active player session.")
                    .setColor("Red")
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                if (!interaction.replied && !interaction.deferred) {
                    const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
                    message = resource.message;
                }
                else {
                    const { resource } = await interaction.editReply({ embeds: [embed], withResponse: true });
                    message = resource.message;
                }

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
                return;
            }

            const currentTrack = queue.current;

            const upcomingTracks = queue.tracks.slice(0, 5);

            const message = [
                `\`🎵\` **Now Playing:** ${currentTrack.title} - ${currentTrack.author}`,
                '',
                '\`⏳\` **Upcoming Tracks:**',
                ...upcomingTracks.map(
                    (track, index) => `${index + 1}. ${track.title} - ${track.author}`,
                ),
            ].join('\n');


            embed
                .setDescription(`${message}`)
                .setColor("Purple")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) {
                const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }
            else {
                const { resource } = await interaction.editReply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }

            setTimeout(() => {
                if (message && message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return;
        } catch (err) {
            console.log(err);

            embed
                .setDescription("\`❌\` Something went wrong.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) {
                const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }
            else {
                const { resource } = await interaction.editReply({ embeds: [embed], withResponse: true });
                message = resource.message;
            }

            setTimeout(() => {
                if (message && message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return;
        }
    }
}