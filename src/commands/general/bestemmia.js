const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

let data;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bestemmia")
        .setDescription("Tira una gran madonna")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    async run(client, interaction) {
        try {
            if (!data) {
                const comandoDirectory = __dirname;
                const jsonPath = path.join(comandoDirectory, '../../bestemmie.json');
                const rawData = await fs.readFile(jsonPath, { encoding: 'utf-8' });
                data = JSON.parse(rawData);
            }

            const rnd = Math.floor(Math.random() * data.length);
            const rigaDaInviare = data[rnd];

            await interaction.reply(rigaDaInviare);
        } catch (error) {
            console.error('Errore durante la lettura del file JSON:', error);
            await interaction.reply({ content: `Si è verificato un errore durante la lettura del file.`, ephemeral: true });
        }
    }
};