const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("server-leave")
        .setDescription("Leave a guild")
        .addStringOption(o => o
            .setName("guild")
            .setDescription("The ID or the name of the guild to leave")
            .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    devOnly: true,

    run: async (client, interaction) => {
        const { options } = interaction;
        const guild = options.getString("guild");
        await interaction.deferReply({ ephemeral: true });

        async function sendMessage(message) {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setDescription(message);

            await interaction.editReply({ embeds: [embed] });
        }

        let fetchedGuild = await client.guilds.fetch(guild).catch(err => { });
        let guilds = [];

        if (fetchedGuild) {
            await fetchedGuild.leave();
            return await sendMessage(`The bot successfully left ${fetchedGuild.name}`);
        }

        if (guilds.length > 1) {
            return await sendMessage(`⚠️ \`${guild}\` is a name that multiple servers the bot has joined have! Use the guild ID to solve`);
        } else if (guilds.length == 0) {
            return await sendMessage(`⚠️ \`${guild}\` is not a server the bot has joined!`);
        } else {
            fetchedGuild = await client.guilds.fetch(guilds[0].id);
            return await fetchedGuild.leave();
        }
    }
}