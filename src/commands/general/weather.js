const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get the weather for a location.')
        .addSubcommand((s) =>
            s
                .setName('current')
                .setDescription('Get the current weather for a location.')
                .addStringOption((option) =>
                    option
                        .setName('location')
                        .setDescription('The location to get the weather for (city name, zip code or ip address)')
                        .setRequired(true)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("aqi")
                        .setDescription("Whether to include the air quality index in the response. (default: true)")
                )
        )
        .addSubcommand((s) =>
            s
                .setName("forecast")
                .setDescription("Get the weather forecast for a location in a specific day and hour.")
                .addStringOption((option) =>
                    option
                        .setName("location")
                        .setDescription("The location to get the weather for (city name, zip code or ip address)")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("days")
                        .setDescription("The day to get the forecast until.")
                        .setRequired(true)
                        .addChoices(
                            { name: "Today", value: "1" },
                            { name: "Tomorrow", value: "2" },
                            { name: "The day after tomorrow", value: "3" },
                        )
                )
        )
        .toJSON(),
    botPermissions: [],
    userPermissions: [],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const host = "api.weatherapi.com/v1";
        const apiKey = process.env.weatherApi;

        await interaction.deferReply();

        const { options } = interaction;
        const location = options.getString("location");

        let reqURL;
        switch (options.getSubcommand()) {
            case "current":
                const aqi = options.getBoolean("aqi") == true ? "yes" : "no";
                reqURL = `https://${host}/current.json?key=${apiKey}&q=${location}&aqi=${aqi}`;

                try {
                    const response = await axios.get(reqURL);
                    const data = response.data;

                    const location = data.location;
                    const current = data.current;

                    const embed = new EmbedBuilder()
                        .setTitle(`Weather for ${location.name}, ${location.region}, ${location.country}`)
                        .setDescription(`**${current.condition.text}**`)
                        .setThumbnail(`https:${current.condition.icon}`)
                        .setColor("Blurple")
                        .addFields(
                            { name: "Termperature", value: `${current.temp_c}°C / ${current.temp_f}°F`, inline: false },
                            { name: "Feels Like", value: `${current.feelslike_c}°C / ${current.feelslike_f}°F`, inline: true },
                            { name: "Wind", value: `${current.wind_kph}kph / ${current.wind_mph}mph`, inline: false },
                            { name: "Humidity", value: `${current.humidity}%`, inline: true },
                            { name: "Precipitation", value: `${current.precip_mm}mm / ${current.precip_in}in`, inline: false },
                            { name: "Pressure", value: `${current.pressure_mb}mb / ${current.pressure_in}in`, inline: true },
                            { name: "Visibility", value: `${current.vis_km}km / ${current.vis_miles}miles`, inline: false }
                        );

                    if (data.current.air_quality) {
                        const aqi = data.current.air_quality;
                        embed.addFields("Air Quality", `Index: ${aqi.pm10}, ${aqi.pm2_5}`, true);
                    }

                    embed
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        .setTimestamp();

                    interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.log("[WEATHER API]", error);
                    interaction.editReply("An error occurred while fetching the weather data.");
                }

                break;
            case "forecast":
                const days = options.getString("days");
                reqURL = `https://${host}/forecast.json?key=${apiKey}&q=${location}&days=${days}`;

                try {
                    const response = await axios.get(reqURL);
                    const data = response.data;

                    const location = data.location;
                    const forecastDays = data.forecast.forecastday;

                    const embeds = forecastDays.map(forecast => {
                        const embed = new EmbedBuilder()
                            .setTitle(`Weather Forecast for ${location.name}, ${location.region}, ${location.country}`)
                            .setColor("Blurple")
                            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            .setTimestamp()
                            .addFields(
                                { name: `Date: ${forecast.date}`, value: `**${forecast.day.condition.text}**`, inline: false },
                                { name: "Temperature", value: `${forecast.day.avgtemp_c}°C / ${forecast.day.avgtemp_f}°F`, inline: false },
                                { name: "Max Temperature", value: `${forecast.day.maxtemp_c}°C / ${forecast.day.maxtemp_f}°F`, inline: true },
                                { name: "Min Temperature", value: `${forecast.day.mintemp_c}°C / ${forecast.day.mintemp_f}°F`, inline: true },
                                { name: "Wind", value: `${forecast.day.maxwind_kph}kph / ${forecast.day.maxwind_mph}mph`, inline: true },
                                { name: "Humidity", value: `${forecast.day.avghumidity}%`, inline: true },
                                { name: "Precipitation", value: `${forecast.day.totalprecip_mm}mm / ${forecast.day.totalprecip_in}in`, inline: true },
                                { name: "Pressure", value: `${forecast.day.avgpressure_mb}mb / ${forecast.day.avgpressure_in}in`, inline: true },
                                { name: "Visibility", value: `${forecast.day.avgvis_km}km / ${forecast.day.avgvis_miles}miles`, inline: true }
                            );
                        return embed;
                    });

                    interaction.editReply({ embeds: embeds });
                } catch (error) {
                    console.log("[WEATHER API]", error);
                    interaction.editReply("An error occurred while fetching the weather data.");
                }

                break;
        }
    }
}