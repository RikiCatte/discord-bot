const { SlashCommandBuilder, EmbedBuilder, codeBlock, ChatInputCommandInteraction, Embed } = require("discord.js");
const axios = require("axios");
const msgConfig = require("../../messageConfig.json");
const APIKey = process.env.NVIDIA_API_KEY;

// BASED ON NVIDIA LLAMA 2 70B
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ask-ai")
        .setDescription("Ask the ai anything.")
        .addStringOption((o) => o
            .setName("prompt")
            .setDescription("The message you want to sent to the AI.")
            .setRequired(true)
        )
        .addNumberOption((o) =>
            o.setName("temperature")
                .setDescription("Controls randomness in ML models, affercing diversity of predictions.")
                .setMinValue(0.1)
                .setMaxValue(1)
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
        const { options } = interaction;
        await interaction.deferReply();

        const query = options.getString("prompt");
        const temp = options.getNumber("temperature") || 0.7;
        const rEmbed = new EmbedBuilder()
            .setFooter({ text: `${client.user.username} - Ask AI`, iconURL: client.user.displayAvatarURL({ dynamic: true }) })

        if (isNaN(temp) || temp < 0.1 || temp > 1) {
            rEmbed.setDescription(`\`❌\` Temperature must be a number betweenm 0.1 and 1.`)

            return interaction.editReply({ embeds: [rEmbed] });
        }

        try {
            await createApiRequestAndReply(temp, query, interaction);
        } catch (error) {
            console.log(error);
            rEmbed.setColor(msgConfig.embedColorError)
                .setDescription(`\`❌\` An error occurred while trying to send your message to the AI. Please try again later.`);

            return interaction.editReply({ embeds: [rEmbed] });
        }

        async function createApiRequestAndReply(temp, input, interaction) {
            let data = "";
            const invokeUrl = 'https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions/0e349b44-440a-44e1-93e9-abe8dcb27158';

            const apiKey = APIKey;
            const headers = {
                Authorization: `Bearer ${apiKey}`,
                Accept: "text/event-stream",
                "Content-Type": "application/json",
            }

            const payload = {
                messages: [{ content: input, role: "user" }],
                temperature: temp,
                // DO NOT CHANGE THESE VALUES ---
                top_p: 0.7,
                max_tokens: 1024,
                seed: 42,
                stream: true,
                // --- DO NOT CHANGE THESE VALUES
            }

            const response = await axios.post(invokeUrl, payload, {
                headers,
                responseType: "stream",
            }).catch((err) => {
                console.log(err);
                throw new Error(err);
            })

            response.data.on("data", async (chunk) => {
                try {
                    let res = chunk.toString("utf-8");
                    let jsonData = res.replace("data: ", "");
                    const parsedData = JSON.parse(jsonData);
                    data += parsedData.choices[0].delta.content;
                } catch {
                    const chunk = await truncateMessage(data, 4096);
                    sendMessage(interaction, chunk, input);
                }
            })
        }

        async function sendMessage(interaction, chunk, input) {
            const userMsg = await truncateMessage(input, 256);
            rEmbed.setTitle(`> ${userMsg}`)
                .setDescription(`${codeBlock(chunk)}`);

            interaction.editReply({ embeds: [rEmbed] });
            return;
        }

        async function truncateMessage(message, length) {
            const maxLength = length;
            if (message.length = maxLength) {
                return message.substring(0, maxLength);
            }

            return message;
        }
    }
};