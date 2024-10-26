const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const TicketSetup = require("../../schemas/ticketsetup");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-setup")
        .setDescription("Manage ticket system.")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Select the channel where the tickets embed message should be send.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption(option =>
            option.setName("category")
                .setDescription("Select the parent (section) of where the tickets should be created.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption(option =>
            option.setName("transcripts")
                .setDescription("Select the channel where the transcripts should be sent.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption(option =>
            option.setName("handlers")
                .setDescription("Select the ticket handlers role.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName("everyone")
                .setDescription("Tag the everyone role.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Set the description for the ticket embed.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("color")
                .setDescription("Set the color for the ticket embed. e.g. Green or #00ff00")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("ticket-categories")
                .setDescription("Set the ticket categories for tickets separated by commas.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("emojis")
                .setDescription("Enter emojis, separated by commas. Use only default emojis due to discord limitations!")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        const { guild, options } = interaction;

        try {
            const channel = options.getChannel("channel");
            const category = options.getChannel("category");
            const transcripts = options.getChannel("transcripts");

            const handlers = options.getRole("handlers");
            const everyone = options.getRole("everyone");

            const description = options.getString("description");

            const color = options.getString("color");

            const categories = options.getString("ticket-categories").split(",");

            const emojis = options.getString("emojis").split(",").map(emoji => emoji.trim());

            let categoriesEmojiArray = [];
            const components = (state) => [
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("ticket-stringMenu")
                        .setPlaceholder("Select a Category to Create a Ticket")
                        .setDisabled(state)
                        .addOptions(
                            categories.map((category, index) => {
                                const emoji = emojis[index % emojis.length] || "";
                                categoriesEmojiArray.push({ [category]: emoji });
                                return new StringSelectMenuOptionBuilder()
                                    .setLabel(category)
                                    .setDescription(`Create a ${category} Type Ticket.`)
                                    .setValue(category)
                                    .setEmoji(emoji);
                            })
                        )
                ),
            ];

            await TicketSetup.findOneAndUpdate(
                { GuildID: guild.id },
                {
                    Channel: channel.id,
                    Category: category.id,
                    Transcripts: transcripts.id,
                    Handlers: handlers.id,
                    Everyone: everyone.id,
                    Description: description,
                    EmbedColor: color,
                    CustomId: ["ticket-stringMenu"],
                    TicketCategories: categories.map(category => category.trim()),
                    MessageId: "",
                    Emojis: emojis,
                    CategoriesEmojiArray: categories.map((category, index) => ({
                        emoji: emojis[index % emojis.length] || "",
                        category: category.trim(),
                    })),
                },
                {
                    new: true,
                    upsert: true,
                }
            );

            const embed = new EmbedBuilder()
                .setColor(`${color}`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setDescription(description)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            const msgId = await guild.channels.cache.get(channel.id).send({
                embeds: [embed],
                components: components(false)
            });

            await TicketSetup.findOneAndUpdate({ GuildID: guild.id }, { MessageId: msgId });

            interaction.reply({ content: `Ticket message has been sent here 👉 <#${channel.id}>`, ephemeral: true });
        } catch (err) {
            console.log(err);
            const errEmbed = new EmbedBuilder()
                .setColor("Red")
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setDescription("\`❌\` Something went wrong...")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }
    }
}