const { SlashCommandBuilder, PermissionFlagsBits, AutoModerationRule, ChatInputCommandInteraction } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("emit-event")
        .setDescription("Emit an event to the client.")
        .addStringOption((option) =>
            option.setName("event")
                .setDescription("The event to emit.")
                .setRequired(true)
        )
        .addUserOption((option) =>
            option.setName("user")
                .setDescription("The user to emit the event to.")
                .setRequired(false)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    run: async (client, interaction) => {
        const { member, options } = interaction;

        const event = options.getString("event");
        const user = options.getUser("user");

        try {
            switch (event) {
                case "guildMemberUpdate":
                    client.emit("guildMemberUpdate", user || member, user || member);
                    break;
                case "guildMemberAdd":
                    client.emit("guildMemberAdd", user || member);
                    break;
                case "guildMemberRemove":
                    client.emit("guildMemberRemove", user || member);
                    break;
                case "autoModerationRuleCreate":
                    client.emit("autoModerationRuleCreate", new AutoModerationRule());
                    break;
                case "applicationCommandPermissionsUpdate":
                    client.emit("applicationCommandPermissionsUpdate");
                    break;
                // Other events...
                default:
                    interaction.reply({ content: `Event **${event}** is not handled in emitEvent.js`, ephemeral: true });
                    return;
            }
        } catch (ex) {
            return console.log(`[EMIT EVENT ERROR] ${ex}`.red)
        }

        return interaction.reply({ content: `Emitted event \`${event}\``, ephemeral: true });
    },
};