const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Show informations about the current playing song.")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { guild } = interaction;

        const config = await BotConfig.findOne({ GuildID: guild.id });
        const serviceConfig = config.services?.music;
        if (!config) return await replyNoConfigFound(interaction, "music");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "music");

        const embed = new EmbedBuilder();
        let message;

        try {
            const queue = useQueue(interaction.guild);

            if (!queue) {
                embed
                    .setDescription("\`❌\` There is no active queue.")
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

            const currentSong = queue.currentTrack;
            if (!currentSong) {
                embed
                    .setDescription("\`❌\` There is no song currently playing.")
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
            } else {
                embed
                    .setDescription(`\`🎵\` **Now playing:** \`${currentSong.cleanTitle}\` - \`${currentSong.duration}\`.\nLink: **${currentSong.url}**\n${queue.node.createProgressBar()}`)
                    .setThumbnail(currentSong.thumbnail)
                    .setColor("Blue")
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