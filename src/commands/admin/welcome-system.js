const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const welcomeSchema = require("../../schemas/welcome");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("welcome-system")
        .setDescription("Welcome System")
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set-Up Welcome System")
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Welcome Channel")
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName("message")
                        .setDescription("Welcome Message"))
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Welcome Role"))
                .addChannelOption(option =>
                    option
                        .setName("rule")
                        .setDescription("Rules Channel")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove Welcome System"))
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [],

    run: async (client, interaction) => {
        if (interaction.options.getSubcommand() === "set") {
            const data = await welcomeSchema.findOne({ Guild: interaction.guild.id });

            if (data) { // If Welcome System is Already Enabled
                const channel = interaction.options.getChannel("channel");
                let message = interaction.options.getString("message");
                if (!message) message = null;
                let role = interaction.options.getRole("role");
                if (role) role = role.id;
                if (!role) role = null;
                let rule = interaction.options.getChannel("rule");
                if (rule) rule = rule.id;
                if (!rule) rule = null;

                await welcomeSchema.findOneAndUpdate({
                    Guild: interaction.guild.id,
                    Channel: channel.id,
                    Message: message,
                    Role: role,
                    Rule: rule
                });

                await data.save();

                const welcomeSetupEmbed = new EmbedBuilder()
                    .setColor("Random")
                    .setTimestamp()
                    .setAuthor({ name: "Welcome Setup Update", iconURL: interaction.guild.iconURL(), url: msgConfig.author_link })
                    .setDescription(`Welcome Channel Set As ${channel}, Role As <@${role}> And Rule Channel As <#${rule}>, Welcome Message: ${message}`)

                await interaction.reply({ embeds: [welcomeSetupEmbed] });
            }

            if (!data) { // If First Time Setup
                const channel = interaction.options.getChannel("channel");
                let message = interaction.options.getString("message");
                if (!message) message = null;
                let role = interaction.options.getRole("role");
                if (role) role = role.id;
                if (!role) role = null;
                let rule = interaction.options.getChannel("rule");
                if (rule) rule = rule.id;
                if (!rule) rule = null;

                const data = await welcomeSchema.create({
                    Guild: interaction.guild.id,
                    Channel: channel.id,
                    Message: message,
                    Role: role,
                    Rule: rule
                });

                await data.save();

                const welcomeSetupEmbed = new EmbedBuilder()
                    .setColor("Random")
                    .setTimestamp()
                    .setAuthor({ name: "Welcome Setup", iconURL: interaction.guild.iconURL() })
                    .setDescription(`Welcome Channel Set As ${channel}, Role As <@${role}> And Rule Channel As <#${rule}>, Welcome Message: ${message}`)

                await interaction.reply({ embeds: [welcomeSetupEmbed] });
            }
        }

        if (interaction.options.getSubcommand() === "remove") {
            const data = await welcome.findOne({ Guild: interaction.guild.id });

            if (!data) {
                await interaction.reply({ content: `Welcome System is not Setup In **${interaction.guild.name}**`, flags: MessageFlags.Ephemeral });
            } else {
                await welcomeSchema.findOneAndDelete({
                    Guild: interaction.guild.id,
                });

                await interaction.reply({ content: `Welcome System Disabled For **${interaction.guild.name}**` });
            }
        }
    }
}