const { EmbedBuilder, Client, GuildMember } = require('discord.js');
const BotConfig = require("../../schemas/BotConfig");

/**
 * @param {Client} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */

module.exports = async (client, oldMember, newMember) => {
	const config = await BotConfig.findOne({ GuildID: oldMember.guild.id });
	const serviceConfig = config?.services?.nitroboost;

	if (!serviceConfig || !serviceConfig.enabled) return;

	try {
		if (!oldMember.premiumSince && newMember.premiumSince) {
			if (!serviceConfig.channelID) {
                console.log(`[NITROBOOST] Please specify channelID in nitroboost service for guild ${oldMember.guild.id}`);
                return;
            }

			const channelId = serviceConfig.channelID.replace(/[<#>]/g, "");
            const boostChannel = oldMember.guild.channels.cache.get(channelId);
            if (!boostChannel) {
                console.log(`[NITROBOOST] The configured boost channel (${serviceConfig.channelID}) does not anymore exist for guild ${oldMember.guild.id}`);
                return;
            }

            const boostEmbed = new EmbedBuilder()
                .setTitle(serviceConfig.embedTitle || "New Booster 🎉")
                .setColor(serviceConfig.embedColor || "#f47fff")
                .setDescription((serviceConfig.embedMessage || "Thank you for boosting the server!").replace('[m]', oldMember.toString()))
                .setFooter({ text: `We now have ${oldMember.guild.premiumSubscriptionCount} boosts!` });

            boostChannel.send({
                content: (serviceConfig.boostMessage || "Thanks for boosting [m]!").replace('[m]', oldMember.toString()),
                embeds: [boostEmbed]
            });
		}
	} catch (error) {
		console.log(`[NITROBOOST] Error occurred while handling nitroboost event: ${error.message}`);
	}
};
