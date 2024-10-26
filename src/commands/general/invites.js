const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const invitesystemSchema = require("../../schemas/invitesSetup");
const inviteSchema = require("../../schemas/invite");
const buttonPagination = require("../../utils/buttonPagination");
const mConfig = require("../../messageConfig.json");

const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invites")
        .setDescription("An advanced invite manager.")
        .addSubcommand((s) => s
            .setName("info")
            .setDescription("Displays the invites info of a user.")
            .addUserOption((o) => o
                .setName("user")
                .setDescription("The user to view their invites.")
            )
        )
        .addSubcommand((s) => s
            .setName("list")
            .setDescription("Displays the invites list of a user.")
            .addUserOption((o) => o
                .setName("user")
                .setDescription("The user to view their invites.")
            )
        )
        .addSubcommand((s) => s
            .setName("leaderboard")
            .setDescription("Displays the invites leaderboard of this server.")
        )
        .addSubcommand((s) => s
            .setName("create")
            .setDescription("Creates a new invite.")
            .addStringOption((o) => o
                .setName("time")
                .setDescription("Invite duration in minutes/hours/days. (Example: 30m, 6h, 3d)")
            )
            .addNumberOption((o) => o
                .setName("uses")
                .setDescription("Number of uses for this invite.")
            )
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.CreateInstantInvite],

    run: async (client, interaction) => {
        const { guild, guildId, options } = interaction;
        const subcommand = options.getSubcommand();
        const member = options.getMember("user");
        const uses = options.getNumber("uses");
        const codeTime = options.getString("time") || "0";

        const allGuildInvites = await guild.invites.fetch();
        let setupData = await invitesystemSchema.findOne({ GuildID: guildId });

        const rEmbed = new EmbedBuilder()

        if (subcommand !== "setup" && !setupData) {
            rEmbed
                .setColor(mConfig.embedColorError)
                .setDescription("`❌` The system is not yet set up. Use `/invites setup` to configure it.");

            return interaction.reply({ embeds: [rEmbed], ephemeral: true });
        }

        try {
            switch (subcommand) {
                case "info": {
                    const user = member?.user || interaction.member.user;
                    const userId = user.id;

                    let invites = await inviteSchema.findOne({ GuildID: guildId, UserID: userId });
                    let totalInvites, fakeInvites, leftInvites, regularInvites;

                    if (!invites) {
                        totalInvites = fakeInvites = leftInvites = regularInvites = 0;
                    } else {
                        totalInvites = invites.TotalInvites;

                        fakeInvites = invites.InvitedUsers.filter(({ User: { Fake } }) => Fake).length;
                        leftInvites = invites.InvitedUsers.filter(({ User: { Left } }) => Left).length;

                        regularInvites = totalInvites - fakeInvites - leftInvites;
                    }

                    rEmbed
                        .setColor("#FFFFFF")
                        .setTitle(user.username)
                        .setDescription(`${member ? `${user.username} currently has` : "You currently have"} **${totalInvites}** total invites. (**${regularInvites}** regular , **${leftInvites}** left, **${fakeInvites}** fake)`)
                        .setFooter({ text: `${client.user.username}`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

                    await interaction.reply({ embeds: [rEmbed] });
                    break;
                }

                case "list": {
                    const totalInvites = allGuildInvites.filter((invite) => invite.inviterId === member?.id || interaction.user.id);

                    const filteredInvites = Array.from(totalInvites.values()).filter((invite) =>
                        invite.inviterId === member?.id || invite.inviterId === interaction.user.id
                    );

                    if (filteredInvites.length === 0) {
                        rEmbed
                            .setColor(mConfig.embedColorError)
                            .setDescription(`\`❌\` ${member ? `${member.user.username} has` : "You have"} no invite codes.`);

                        return interaction.reply({ embeds: [rEmbed], ephemeral: true });
                    }

                    const pages = [];
                    for (let page = 0; page < Math.ceil(filteredInvites.length / 10); page++) {
                        const pageInvites = filteredInvites.slice(page * 10, (page + 1) * 10);

                        const fields = [
                            {
                                name: "Code",
                                value: pageInvites.map((invite) => `\`${invite.code}\`\n`).join(""),
                                inline: true
                            },
                            {
                                name: "Uses",
                                value: pageInvites.map((invite) => `\`${invite.uses}\`\n`).join(""),
                                inline: true
                            }
                        ];

                        const pageEmbed = new EmbedBuilder()
                            .setColor("#FFFFFF")
                            .setTitle(`Invites list - page ${pages.length + 1}`)
                            .setFields(fields)
                            .setDescription(`${member ? `${member.user.username} currently has` : "You currently have"} **${filteredInvites.length}** total invite codes.`)
                            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

                        pages.push(pageEmbed);
                    }

                    console.log("interaction: ", interaction, " pages: ", pages)
                    await buttonPagination(interaction, pages);
                    break;
                }
                case "leaderboard": {
                    const allMemberData = await inviteSchema.find({ GuildID: guildId });

                    let memberUses = guild.members.cache
                        .filter((member) => !member.user.bot).map((member) => {
                            const memberData = allMemberData.find((data) => data.UserID === member.id);

                            return { member: member, totalInvites: memberData ? memberData.TotalInvites : 0 };
                        });

                    memberUses.sort((a, b) => b.TotalInvites - a.TotalInvites);

                    const pages = [];
                    const pageSize = 10;

                    for (let page = 0; page < Math.ceil(memberUses.length / pageSize); page++) {
                        const pageUses = memberUses.slice(page * pageSize, (page + 1) * pageSize);

                        const fields = [
                            {
                                name: "Member",
                                value: pageUses.map((invite) => `${invite.member}\n`).join(""),
                                inline: true
                            },
                            {
                                name: "Total invites",
                                value: pageUses.map((invite) => `${invite.totalInvites}\n`).join(""),
                                inline: true
                            }
                        ];

                        const embedPage = new EmbedBuilder()
                            .setFields(fields)
                            .setColor("#FFFFFF")
                            .setTitle(`Invite leaderboard - page ${page + 1}`)
                            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

                        pages.push(embedPage);
                    }

                    await buttonPagination(interaction, pages);
                    break;
                }
                case "create": {
                    const maxAgeSeconds = Math.min(ms(codeTime) / 1000, 604800);

                    const inviteOptions = {
                        ...(maxAgeSeconds && { maxAge: maxAgeSeconds }),
                        ...(uses && { maxUses: uses })
                    };

                    const invite = await guild.invites.create(interaction.channelId, inviteOptions);

                    rEmbed
                        .setColor("#FFFFFF")
                        .setTitle("New server invite")
                        .setDescription(`Here's your invite code: \`${invite.code}\`\nYour invite link is: https://discord.gg/${invite.code}`);

                    await interaction.reply({ embeds: [rEmbed], ephemeral: true });
                    break;
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}