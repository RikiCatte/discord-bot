require("colors");

const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ChatInputCommandInteraction, MessageFlags } = require("discord.js");
const { developersId, testServerId } = require("../../config.json");
const mConfig = require("../../messageConfig.json");
const getLocalCommands = require("../../utils/getLocalCommands");
const botConfigCache = require("../../utils/BotConfig/botConfigCache");

/**
 * 
 * @param {Client} client 
 * @param {ChatInputCommandInteraction} interaction 
 * @returns 
 */

module.exports = async (client, interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const localCommands = getLocalCommands();

	const commandObject = localCommands.find((cmd) => cmd.data.name === interaction.commandName);
	if (!commandObject) return;

	// Recover the config from the cache
	const config = await botConfigCache.getConfig(interaction.guild.id);

	// Defining if the config is invalid
	const configInvalid = !config || !config.services || Object.keys(config.services).length === 0;

	// Allow only command that are in setup folder when the config is invalid
	if (configInvalid && commandObject.category !== "setup") {
		return interaction.reply({
			content: "\`⚠️\` The bot is not configured or the configuration is incomplete. Use `/bot-setup` or `/bot-set-service` to complete the setup.",
			flags: MessageFlags.Ephemeral
		});
	}

	try {
		if (commandObject.devOnly) {
			if (!developersId.includes(interaction.member.id)) {
				const rEmbed = new EmbedBuilder()
					.setColor(`${mConfig.embedColorError}`)
					.setDescription(`${mConfig.commandDevOnly}`);
				interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
				return;
			};
		};

		if (commandObject.testMode) {
			if (interaction.guild.id !== testServerId) {
				const rEmbed = new EmbedBuilder()
					.setColor(`${mConfig.embedColorError}`)
					.setDescription(`${mConfig.commandTestMode}`);
				interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
				return;
			};
		};

		if (commandObject.disabled) {
			const rEmbed = new EmbedBuilder()
				.setColor(`${mConfig.embedColorError}`)
				.setDescription(`${mConfig.commandDisabled}`);
			interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
			return;
		}

		if (commandObject.userPermissions?.length) {
			for (const permission of commandObject.userPermissions) {
				if (interaction.member.permissions.has(permission)) {
					continue;
				};
				const rEmbed = new EmbedBuilder()
					.setColor(`${mConfig.embedColorError}`)
					.setDescription(`${mConfig.userNoPermissions}`);
				interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
				return;
			};
		};

		if (commandObject.botPermissions?.length) {
			for (const permission of commandObject.botPermissions) {
				const bot = interaction.guild.members.me;
				if (bot.permissions.has(permission)) {
					continue;
				};
				const rEmbed = new EmbedBuilder()
					.setColor(`${mConfig.embedColorError}`)
					.setDescription(`${mConfig.botNoPermissions}`);
				interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
				return;
			};
		};

		await commandObject.run(client, interaction);
	} catch (error) {
		if (!interaction.inGuild())
			return await interaction.reply({ content: "You can't use slash commands in DMs!", flags: MessageFlags.Ephemeral });

		console.log(error);
		await interaction.reply({ content: "There was an error while executing this command!", flags: MessageFlags.Ephemeral }).catch(err => { });

		let errorTime = `<t:${Math.floor(Date.now() / 1000)}:R>`;

		const sendChannel = await client.channels.fetch(mConfig.errorFlagSystemChannel);

		const embed = new EmbedBuilder()
			.setTitle(`\`🚩\` Flagged Error!`)
			.setColor("Red")
			.setDescription("An error has been flagged while using a slash command!")
			.addFields({ name: "Error Command", value: `\`${interaction.commandName}\`` })
			.addFields({ name: "Error Stack", value: `\`${error.stack}\`` })
			.addFields({ name: "Error Message", value: `\`${error.message}\`` })
			.addFields({ name: "Error Timestamp", value: `${errorTime}` })
			.setFooter({ text: "Error Flag System", iconURL: mConfig.footer_iconURL })
			.setTimestamp()

		const button = new ButtonBuilder()
			.setCustomId("fetchErrorUserInfo")
			.setLabel("❓ Fetch User Info")
			.setStyle(ButtonStyle.Danger)

		const row = new ActionRowBuilder()
			.addComponents(button);

		const msg = await sendChannel.send({ embeds: [embed], components: [row] }).catch(err => { });

		let time = 300000;
		const collector = await msg.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time
		})

		collector.on("end", async () => {
			button.setDisabled(true);
			embed.setFooter({ text: "Error Flag System -- your user fetch button has expired" })
			await msg.edit({ embeds: [embed], components: [row] });
		})
	}
};