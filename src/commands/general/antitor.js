const { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");
const { options } = require('superagent');
const { botPermissions } = require('./qrcode');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("antitor")
        .setDescription("Use antitor api to get information.")
        .addSubcommandGroup(sg =>
            sg
                .setName("peerapi")
                .setDescription("API which provides historical data of downloading and sharing content using the BitTorrent protocol.")
                .addSubcommand(s =>
                    s
                        .setName("iphistory")
                        .setDescription("Get extendend infos about a specific ip address.")
                        .addStringOption(o =>
                            o
                                .setName("ipaddress")
                                .setDescription("IP address which history you want to receive.")
                                .setRequired(true)
                        )
                        .addIntegerOption(o =>
                            o
                                .setName("days")
                                .setDescription("[OPTIONAL] Search history max days ago. Default value is 14. Max value is 30.")
                                .setMinValue(1)
                                .setMaxValue(30)
                                .setRequired(false)
                        )
                        .addIntegerOption(o =>
                            o
                                .setName("contents")
                                .setDescription("[OPTIONAL] Max contents in response. Default value is 20. Max value is 100.")
                                .setMinValue(1)
                                .setMaxValue(100)
                                .setRequired(false)
                        )
                        .addStringOption(o =>
                            o
                                .setName("language")
                                .setDescription("[OPTIONAL] Choose between English or Russian. Default value is English.")
                                .setRequired(false)
                        )
                )
                .addSubcommand(s =>
                    s
                        .setName("ipexist")
                        .setDescription("Check if IP exists or not in antitor database.")
                        .addStringOption(o =>
                            o
                                .setName("ipaddress")
                                .setDescription("IP address you want to know about in the antitor database.")
                                .setRequired(true)
                        )
                )
        )
        .addSubcommandGroup(sg =>
            sg
                .setName("contentapi")
                .setDescription("API which provides historical data of downloading and sharing content using the BitTorrent protocol.")
                .addSubcommand(s =>
                    s
                        .setName("sumstats")
                        .setDescription("Get summary statistics about torrent peers and downloaded contents by day.")
                        .addStringOption(o =>
                            o
                                .setName("day")
                                .setDescription("Specify the day to get summary statistics. FORMAT: yyyy-MM-dd (2020-12-25)")
                                .setRequired(true)
                        )
                        .addStringOption(o =>
                            o
                                .setName("imdb")
                                .setDescription("[OPT] IMDB ID. Shows all contents if not given. You can pass several: 'imdb=tt2345759&imdb=tt1631867")
                                .setRequired(false)
                        )
                        .addStringOption(o =>
                            o
                                .setName("countrycode")
                                .setDescription("[OPTIONAL] ISO 3166-1 alpha-2 country code. Shows all countries if countryCode is not specified.")
                                .setRequired(false)
                        )
                        .addBooleanOption(o =>
                            o
                                .setName("short")
                                .setDescription("[OPTIONAL] True to get shortened statistics. Default value is false.")
                                .setRequired(false)
                        )
                )
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const host = "api.antitor.com";
        const apiKey = process.env.antitorApi;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options } = interaction;
        const ipAddress = options.getString("ipaddress");

        let reqURL;
        switch (options.getSubcommand()) {
            case "iphistory":
                const days = options.getInteger("days") ?? 14;
                const contents = options.getInteger("contents") ?? 20;
                const language = options.getString("language") ?? "english";

                reqURL = `https://${host}/history/peer?ip=${ipAddress}&days=${days}&contents=${contents}&lang=${language}&key=${apiKey}`;

                try {
                    const response = await axios.get(reqURL);
                    const data = response.data;

                    const embed = new EmbedBuilder()
                        .setTitle(`IP Info`)
                        .setColor("Blurple")
                        .addFields(
                            { name: "IP", value: data.ip ?? "Unknown", inline: true },
                            { name: "ISP", value: data.isp ?? "Unknown", inline: true },
                            { name: "Has Porno", value: `${data.hasPorno}` ?? "Unknown", inline: true },
                            { name: "Has Child Porno", value: `${data.hasChildPorno}` ?? "Unknown", inline: false },
                            { name: "Country", value: data.geoData?.country ?? "Unknown", inline: true },
                            { name: "City (appr.)", value: data.geoData?.city ?? "Unknown", inline: true },
                            { name: "Latitude", value: `${data.geoData?.latitude}` ?? "Unknown", inline: false },
                            { name: "Longitude", value: `${data.geoData?.longitude}` ?? "Unknown", inline: true }
                        );

                    if (data.contents && data.contents.length > 0) {
                        embed.addFields(
                            { name: "Content Category", value: data.content?.category ?? "Unknown", inline: true },
                            { name: "Movie imdbId", value: `${data.content?.imdbId}` ?? "Unknown", inline: true },
                            { name: "Content Name", value: data.content?.name ?? "Unknown", inline: true },
                            { name: "Content StartDate", value: `${data.content?.startDate}` ?? "Unknown", inline: false },
                            { name: "Content EndDate", value: `${data.content?.endDate}` ?? "Unknown", inline: true },
                            { name: "Torrent Info", value: `${data.content?.torrent}` ?? "Unknown", inline: true },
                            { name: "Torrent Size", value: `${data.content?.torrent?.size}` ?? "Unknown", inline: false },
                            { name: "Torrent Name", value: data.content?.torrent?.name ?? "Unknown", inline: true }
                        );
                    }

                    embed
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(msgConfig.thumbnail)
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [embed] });
                } catch (e) {
                    console.log(e);
                    return await interaction.editReply({ content: 'Something went wrong! please contact Bot Dev', flags: MessageFlags.Ephemeral });
                }
            case "ipexist":
                reqURL = `https://${host}/history/exist?ip=${ipAddress}&key=${apiKey}`;

                try {
                    const response = await axios.get(reqURL);
                    const data = response.data;

                    const embed = new EmbedBuilder();

                    if (response) {
                        embed
                            .setTitle(`IP Exist`)
                            .setColor("Blurple")
                            .addFields(
                                { name: "IP", value: `${data.ip}` ?? "Unknown", inline: true },
                                { name: "Exists in Antitor DB", value: `${data.exists}` ?? "Unknown", inline: true },
                                { name: "Last seen date in UTC", value: `${data.date}` ?? "Unknown", inline: false }
                            )
                            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                            .setThumbnail(msgConfig.thumbnail)
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            .setTimestamp();

                        return await interaction.editReply({ embeds: [embed] });
                    };

                    return await interaction.editReply({ content: `The IP Address ${ipAddress} is not found in antitor database!` });
                } catch (e) {
                    console.log(e);
                    return await interaction.editReply({ content: 'Something went wrong! please contact Bot Dev', flags: MessageFlags.Ephemeral });
                }
            case "sumstats":
                const day = options.getString("day");
                const imdbId = options.getString("imdb");
                const countryCode = options.getString("countrycode");
                const short = options.getBoolean("short");

                reqURL = `https://${host}/content/summary?day=${day}&imdb=${imdbId}&short=${short}&countryCode=${countryCode}&key=${apiKey}`;

                try {
                    const response = await axios.get(reqURL);
                    const data = response.data;
                    console.log(JSON.stringify(data));

                    const embed = new EmbedBuilder();

                    if (response) {
                        console.log("ciao")

                        embed
                            .setTitle(`Content Summary Statistics`)
                            .setColor("Blurple")
                            .addFields(
                                { name: "Day", value: `${data.day}` ?? "Unknown", inline: true },
                                { name: "Total Peers", value: `${data.totalPeers}` ?? "Unknown", inline: true }
                            )


                        if (data.contents && data.contents.length > 0) {
                            embed.addFields(
                                { name: "imdbId of Movie", value: `${data.contents.imdb}` ?? "Unknown", inline: false },
                                { name: "Movie Title", value: `${data.contents.name}` ?? "Unknown", inline: true },
                                { name: "Total Peers", value: `${data.contents.totalPeers}` ?? "Unknown", inline: true },
                            )
                        }

                        embed
                            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                            .setThumbnail(msgConfig.thumbnail)
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            .setTimestamp();

                        return await interaction.editReply({ embeds: [embed] });
                    };

                    return await interaction.editReply({ content: `The IP Address ${ipAddress} is not found in antitor database!` });
                } catch (e) {
                    console.log(e);
                    return await interaction.editReply({ content: 'Something went wrong! please contact Bot Dev', flags: MessageFlags.Ephemeral });
                }
        }
    }
}