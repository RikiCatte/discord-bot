const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const moderationSchema = require("../schemas/moderation");
const mConfig = require("../messageConfig.json");

module.exports = {
	customId: "banBtn",
	userPermissions: [],
	botPermissions: [PermissionFlagsBits.BanMembers],

	run: async (client, interaction) => {
		const { message, channel, guildId, guild, user } = interaction;

		const embedAuthor = message.embeds[0].author;
		const fetchedMembers = await guild.members.fetch({
			query: embedAuthor.name,
			limit: 1,
		});
		const targetMember = fetchedMembers.first();

		const rEmbed = new EmbedBuilder()
			.setColor("FFFFFF")
			.setFooter({ text: `${client.user.username} - Moderate user` })
			.setAuthor({
				name: `${targetMember.user.username}`,
				iconURL: `${targetMember.user.displayAvatarURL({ dynamic: true })}`,
				url: mConfig.author_link
			})
			.setDescription(
				`\`❔\` What is the reason to ban ${targetMember.user.username}?\n\`❕\` You have 15 seconds to reply. After this time the moderation will be automatically cancelled.\n\n\`💡\` To continue without a reason, answer with \`-\`.\n\`💡\` To cancel the moderation, answer with \`cancel\`.`
			);

		message.edit({ embeds: [rEmbed], components: [] });

		const filter = (m) => m.author.id === user.id;
		const reasonCollector = await channel
			.awaitMessages({ filter, max: 1, time: 15_000, errors: ["time"] })
			.then((reason) => {
				if (reason.first().content.toLowerCase() === "cancel") {
					reason.first().delete();
					rEmbed
						.setColor(mConfig.embedColorError)
						.setDescription("`❌` Moderation cancelled.");
					message.edit({ embeds: [rEmbed] });
					setTimeout(() => {
						message.delete();
					}, 2_000);
					return;
				}
				return reason;
			})
			.catch(() => {
				rEmbed
					.setColor(mConfig.embedColorError)
					.setDescription("`❌` Moderation cancelled.");
				message.edit({ embeds: [rEmbed] });
				setTimeout(() => {
					message.delete();
				}, 2_000);
				return;
			});
		const reasonObj = reasonCollector?.first();
		if (!reasonObj) return;

		let reason = reasonObj.content;
		if (reasonObj.content === "-") {
			reason = "No reason specified.";
		}
		reasonObj.delete();

		// Level 2
		let dataMG = await moderationSchema.find({ MultiGuilded: true });
		if (dataMG) {
			let i;
			for (i = 0; i < dataMG.length; i++) {
				const { GuildID, LogChannelID } = dataMG[i];
				if (GuildID === guildId) continue;

				const externalGuild = client.guilds.cache.get(GuildID);
				const externalLogChannel =
					externalGuild.channels.cache.get(LogChannelID);
				const externalBot = await externalGuild.members.fetch(client.user.id);

				try {
					const externalMember = await externalGuild.members.fetch(
						targetMember.id
					);

					if (
						externalMember.roles.highest.position >=
						externalBot.roles.highest.position
					)
						continue;

					await externalGuild.bans.create(externalMember, {
						deleteMessageSeconds: 60 * 60 * 24 * 7,
						reason: "Automatic multi-guilded ban.",
					});

					const lEmbed = new EmbedBuilder()
						.setColor("White")
						.setTitle("`⛔` User banned")
						.setAuthor({
							name: externalMember.user.username,
							iconURL: externalMember.user.displayAvatarURL({ dynamic: true }),
							url: mConfig.author_link
						})
						.setDescription(
							`\`💡\` To unban ${externalMember.user.username}, use \`/unban ${externalMember.user.id}\` to revoke this ban.`
						)
						.addFields(
							{
								name: "Banned by",
								value: `<@${client.user.id}>`,
								inline: true,
							},
							{
								name: "Reason",
								value: "`Automatic multi-guilded ban.`",
								inline: true,
							}
						)
						.setFooter({
							iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
							text: `${client.user.username} - Logging system`,
						});

					externalLogChannel.send({ embeds: [lEmbed] });
				} catch (error) {
					continue;
				}
			}
		}
		// Level 2

		targetMember.ban({
			reason: `${reason}`,
			deleteMessageSeconds: 60 * 60 * 24 * 7,
		});

		let dataGD = await moderationSchema.findOne({ GuildID: guildId });
		const { LogChannelID } = dataGD;
		const loggingChannel = guild.channels.cache.get(LogChannelID);

		const lEmbed = new EmbedBuilder()
			.setColor("FFFFFF")
			.setTitle("`❌` User banned")
			.setAuthor({
				name: targetMember.user.username,
				iconURL: targetMember.user.displayAvatarURL({ dynamic: true }),
				url: mConfig.author_link
			})
			.setDescription(
				`\`💡\` To unban ${targetMember.user.username}, use \`/unban ${targetMember.user.id}\` to revoke this ban.`
			)
			.addFields(
				{ name: "Banned by", value: `<@${user.id}>`, inline: true },
				{ name: "Reason", value: `${reason}`, inline: true }
			)
			.setFooter({
				iconURL: client.user.displayAvatarURL({ dynamic: true }),
				text: `${client.user.username} - Logging system`,
			});

		loggingChannel.send({ embeds: [lEmbed] });

		rEmbed
			.setColor(mConfig.embedColorSuccess)
			.setDescription(
				`\`✅\` Successfully banned ${targetMember.user.username}.`
			);

		message.edit({ embeds: [rEmbed] });
		setTimeout(() => {
			message.delete();
		}, 2_000);
	},
};
