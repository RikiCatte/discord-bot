const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lfg")
        .setDescription("Look for a video game group!")
        .addStringOption(option =>
            option.setName("game")
                .setDescription("The name of the video game to search for")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        var { options } = interaction;
        var game = options.getString("game");

        var members = await interaction.guild.members.fetch();

        var group = [];
        await members.forEach(async member => {
            if (!member.presence || !member.presence.activities[0]) return;

            var currentGame = await member.presence.activities[0].name;

            if (currentGame.toLowerCase() == game.toLowerCase()) group.push({ member: member.id, game: currentGame });
            else return;
        });

        group = group.slice(0, 2000);

        const embed = new EmbedBuilder()
            .setColor("Blurple")

        var string;
        await group.forEach(async value => {
            const member = await interaction.guild.members.cache.get(value.member);
            string += `Member: **${member.user.username}** (${value.member}) is on ${value.game}!\n`;
        });

        if (string) {
            string = string.replace("undefined", " ");

            embed
                .setTitle(`Members Playing \`${game}\``)
                .setDescription(string);
        } else {
            embed.setDescription(`\`😢\` Looks like no one is playing \`${game}\``);
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}