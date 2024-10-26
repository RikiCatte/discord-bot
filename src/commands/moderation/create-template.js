const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-template')
        .setDescription('Create a template for this server.')
        .addStringOption(option => option.setName('name').setDescription('Templates\'s name').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('Template\'s description').setRequired(true))
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],


    run: async (client, interaction) => {
        const { options } = interaction;
        const name = options.getString('name');
        const description = options.getString('description');

        const template = await axios.post(`https://discord.com/api/v10/guilds/${interaction.guild.id}/template`,
            {
                name: name,
                description: description,
            },
            {
                headers: {
                    'Authorization': `Bot ${process.env.TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        ).catch(err => { console.log(err) });

        if (!template) return await interaction.reply({ content: `There is already an existing template!`, ephemeral: true });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setLabel('Sync Template 🔁')
                    .setCustomId('templateButton')
            );

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(`✅ | Your template -> https://discord.new/${template.data.code}`)

        const msg = await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });

        const collector = msg.createMessageComponentCollector({ ComponentType: ComponentType.Button });
        collector.on('collect', async i => {
            if (i.customId === 'templateButton') {
                const sync = await axios.put(`https://discord.com/api/v10/guilds/${interaction.guild.id}/templates/${template.data.code}`, {

                }, {
                    headers: {
                        'Authorization': `Bot ${process.env.TOKEN}`
                    }
                }).catch(err => { console.log(err) });

                embed.setDescription(`✅| Your synced template -> https://discord.new/${sync.data.code}`)

                await msg.edit({ embeds: [embed], components: [button] });
                await i.reply({ content: `☝️ Your template is synced, new link above`, ephemeral: true });
            } else {
                return;
            }
        });

        setTimeout(async () => {
            if (!collector.ended) {
                collector.stop();  // Stop the collector if it hasn't already ended
            }
            await msg.edit({ embeds: [embed], components: [] }).catch(err => { console.log(err) });
        }, 300000);
    }
}