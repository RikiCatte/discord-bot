//require('dotenv').config();
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const notes = require("../../schemas/releasenotes");
const config = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("release-notes")
        .setDescription("Release notes")
        .addSubcommand(subcommand => subcommand.setName("publish").setDescription("Add new release notes").addStringOption(option => option.setName("updated-notes").setDescription("The notes to publish").setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName("view").setDescription("View the most recent release notes"))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { options } = interaction;
        const subcommand = options.getSubcommand();
        let data = await notes.find();

        async function sendMessage(message) {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setDescription(message);

            await interaction.reply({ embeds: [embed], ephemeral: true })
        }

        async function updateNotes(update, version) {
            await notes.create({
                Updates: update,
                Date: Date.now(),
                Developer: interaction.user.username,
                Version: version
            })

            await sendMessage("✅ Succesfully updated release notes");
        }

        switch (subcommand) {
            case "publish":
                const developersId = config.developersId;

                if (!developersId.includes(interaction.user.id)) return interaction.reply({ content: "Only DEVs can publish release notes!", ephemeral: true });

                const update = options.getString("updated-notes");
                if (data.length > 0) {
                    await notes.deleteMany();

                    var version = 0;
                    await data.forEach(async value => {
                        version += value.Version + 0.1;
                    })

                    version = Math.round(version * 10) / 10;

                    await updateNotes(update, version);
                } else {
                    await updateNotes(update, 1.0);
                }
                break;
            case "view":
                if (data.length == 0) {
                    await sendMessage(`\`🚧\` There is no public release notes yet...`);
                } else {
                    var string = ``;
                    await data.forEach(async value => {
                        string += `\`${value.Version}\` \n\n **Update Information:**\n\`\`\`${value.Updates}\`\`\`\n\n**Updating Developer:** ${value.Developer}\n**Update Date:** <t:${Math.floor(value.Date / 1000)}:R>`
                    })

                    await sendMessage(`🛠 **Release Notes** ${string}`);
                }
        }
    }
};