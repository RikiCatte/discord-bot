const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled, updateServiceConfig } = require("../../utils/BotConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("suggestion")
        .setDescription("Suggest something.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Create a suggestion.")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Name your suggestion")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("description")
                        .setDescription("Describe your suggestion.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Delete a suggestion from DB and from the Discord channel.")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("The message ID of the suggestion to delete.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete-all")
                .setDescription("Delete all suggestions from DB and from the Discord channel.")
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { guild, options, member } = interaction;
        const subcommand = options.getSubcommand();

        const config = await BotConfig.findOne({ GuildID: guild.id });
        const serviceConfig = config.services?.suggest;

        if (!config) return replyNoConfigFound(interaction, "suggest");
        if (!serviceConfig?.enabled) return replyServiceNotEnabled(interaction, "suggest");

        if (subcommand === "create") {
            const name = options.getString("name");
            const description = options.getString("description");

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`A suggestion made by ${member}`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setColor("Random")
                .addFields(
                    { name: "Suggestion", value: `${name}` },
                    { name: "Description", value: `${description}` },
                )
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                .setTimestamp();

            const suggestionChannel = await guild.channels.cache.get(serviceConfig.ChannelID)

            const suggestionMessage = await suggestionChannel.send({ embeds: ([embed]) });
            await suggestionMessage.react('✅');
            await suggestionMessage.react('❌');

            serviceConfig.Suggestions.push({
                SuggestionMessageID: suggestionMessage.id,
                AuthorID: member.id,
                Name: name,
                Description: description,
            });

            await updateServiceConfig(config, "suggest", { Suggestions: serviceConfig.Suggestions });

            return await interaction.reply({ content: `\`✅\` Your suggestion has been succesfully sent in <#${serviceConfig.ChannelID}>`, flags: MessageFlags.Ephemeral });
        } else if (subcommand === "delete") {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "`⚠️` You need to be an administrator to use this command.", flags: MessageFlags.Ephemeral });

            const messageId = options.getString("id");
            const suggestion = serviceConfig.Suggestions.find(s => s.SuggestionMessageID === messageId);
            if (!suggestion) return interaction.reply({ content: "`❌` No suggestion found with the provided message ID.", flags: MessageFlags.Ephemeral });

            const suggestionChannel = guild.channels.cache.get(serviceConfig.ChannelID);
            if (!suggestionChannel) return interaction.reply({ content: "`❌` Suggestion channel not found.", flags: MessageFlags.Ephemeral });

            try {
                const message = await suggestionChannel.messages.fetch(messageId);
                if (message) await message.delete();
                else return await interaction.reply({ content: "`⚠️` The suggestion message could not be found in the channel, but it should have been removed from the database.", flags: MessageFlags.Ephemeral });
            } catch (err) { }

            serviceConfig.Suggestions = serviceConfig.Suggestions.filter(s => s.SuggestionMessageID !== messageId);
            await updateServiceConfig(config, "suggest", { Suggestions: serviceConfig.Suggestions });

            return interaction.reply({ content: "`✅` Suggestion deleted from the channel and the database.", flags: MessageFlags.Ephemeral });
        } else if (subcommand === "delete-all") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.editReply({ content: "`⚠️` You need to be an administrator to use this command.", flags: MessageFlags.Ephemeral });

            const suggestionChannel = guild.channels.cache.get(serviceConfig.ChannelID);
            if (!suggestionChannel) return interaction.editReply({ content: "`❌` Suggestion channel not found.", flags: MessageFlags.Ephemeral });

            let suggestionsCount = serviceConfig.Suggestions.length;
            if (suggestionsCount === 0) return interaction.editReply({ content: "`⚠️` There are no suggestions to delete.", flags: MessageFlags.Ephemeral });

            for (const suggestion of serviceConfig.Suggestions) {
                try {
                    const message = await suggestionChannel.messages.fetch(suggestion.SuggestionMessageID);
                    if (message) await message.delete();
                } catch (err) { }
            }

            serviceConfig.Suggestions = [];
            await updateServiceConfig(config, "suggest", { Suggestions: serviceConfig.Suggestions });

            return interaction.editReply({ content: `\`✅\` Succesfully deleted all (${suggestionsCount}) suggestions from the channel and the database.`, flags: MessageFlags.Ephemeral });
        }
    }
}