const { EmbedBuilder, Client, GuildMember } = require('discord.js');
const boostSchema = require('../../schemas/boostSchema');

/**
 * @param {Client} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */

module.exports = async (client, oldMember, newMember) => {
	if (!oldMember.premiumSince && newMember.premiumSince) {
		const boostData = await boostSchema.findOne({
			guildID: oldMember.guild.id,
		});
		if (!boostData) return;

		const boostChannel = oldMember.guild.channels.cache.get(boostData.boostingChannelID);
		if (!boostChannel) return;

		const boostEmbed = new EmbedBuilder()
			.setTitle(boostData.boostEmbedTitle)
			.setColor(boostData.boostEmbedColor)
			.setDescription(boostData.boostEmbedMsg.replace('[m]', oldMember.toString()))
			.setFooter({ text: `We now have ${oldMember.guild.premiumSubscriptionCount} boosts!` });

		boostChannel.send({ content: boostData.boostMsg.replace('[m]', oldMember.toString()), embeds: [boostEmbed] });
	}
};
