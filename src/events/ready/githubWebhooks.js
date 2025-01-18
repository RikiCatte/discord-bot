const express = require("express");
const crypto = require("crypto");
const { EmbedBuilder } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
require('dotenv').config();

module.exports = (client) => {
    const app = express();
    const port = msgConfig.httpServerPort || 3000;

    app.use(express.json());

    // Middleware to verify the secret
    app.use((req, res, next) => {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) {
            return res.status(401).send('No signature found');
        }

        const hmac = crypto.createHmac('sha256', process.env.github_webhook_secret);
        const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

        if (signature !== digest) {
            return res.status(401).send('Invalid signature');
        }

        next();
    });

    app.post(`${process.env.github_webhook_endpoint}`, async (req, res) => {
        const event = req.headers['x-github-event'];
        const payload = req.body;
        const channel = await client.channels.cache.get(msgConfig.githubUpdatesChannelId);

        if (!channel) {
            return res.status(500).send('Channel not found');
        }

        let embed;

        try {
            switch (event) {
                case 'push':
                    if (payload.commits && payload.commits.length > 0) {
                        for (const commit of payload.commits) {
                            console.log("commit: " + commit);
                            embed = new EmbedBuilder()
                                .setTitle("\`🔔\` New Commit")
                                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                                .addFields(
                                    { name: "Committer", value: commit.author ? commit.author.name : "Unknown committer", inline: false },
                                    { name: "Modified files", value: commit.modified.join("\n"), inline: true },
                                )
                                .setDescription(commit.message ? commit.message : "No commit message")
                                .setURL(commit.url ? commit.url : "")
                                .setColor("#0099ff")
                                .setTimestamp()
                                .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                            await channel.send({ embeds: [embed] });
                        }
                    }
                    break;

                case 'pull_request':
                    embed = new EmbedBuilder()
                        .setTitle("\`👉\` New Pull Request")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .addFields(
                            { name: "Title", value: payload.pull_request.title, inline: false },
                            { name: "User", value: payload.pull_request.user.login, inline: true }
                        )
                        .setURL(payload.pull_request.html_url)
                        .setColor("#0099ff")
                        .setTimestamp()
                        .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                    await channel.send({ embeds: [embed] });
                    break;

                case 'issues':
                    embed = new EmbedBuilder()
                        .setTitle("\`🧰\` New Issue")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .addFields(
                            { name: "Title", value: payload.issue.title, inline: false },
                            { name: "User", value: payload.issue.user.login, inline: true }
                        )
                        .setURL(payload.issue.html_url)
                        .setColor("#0099ff")
                        .setTimestamp()
                        .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                    await channel.send({ embeds: [embed] });
                    break;

                case 'create':
                    embed = new EmbedBuilder()
                        .setTitle("\`➕\` New Branch/Tag Created")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .setDescription(`Branch/Tag: ${payload.ref}`)
                        .setColor("#0099ff")
                        .setTimestamp()
                        .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                    await channel.send({ embeds: [embed] });
                    break;

                case 'delete':
                    embed = new EmbedBuilder()
                        .setTitle("\`➖\` Branch/Tag Deleted")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .setDescription(`Branch/Tag: ${payload.ref}`)
                        .setColor("#ff0000")
                        .setTimestamp()
                        .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                    await channel.send({ embeds: [embed] });
                    break;

                case 'code_scanning_alert':
                    embed = new EmbedBuilder()
                        .setTitle("\`⚠️\` New Code Scan Alert")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .setDescription(`Alert: ${payload.alert.rule.description}, Severity: ***${payload.alert.rule.severity}***`)
                        .setURL(payload.alert.html_url)
                        .setColor("#ffcc00")
                        .setTimestamp()
                        .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                    await channel.send({ embeds: [embed] });
                    break;

                case 'commit_comment':
                    embed = new EmbedBuilder()
                        .setTitle("\`💭\` New Commit Comment")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .addFields(
                            { name: "User", value: payload.comment.user.login, inline: false },
                            { name: "Comment body", value: payload.comment.body, inline: true }
                        )
                        .setURL(payload.comment.html_url)
                        .setColor("#00cc99")
                        .setTimestamp()
                        .setFooter({ text: `${msgConfig.footer_text}`, iconURL: msgConfig.footer_iconURL });

                    await channel.send({ embeds: [embed] });
                    break;

                default:
                    console.log(`[githubWebhooks.js] Unhandled event: ${event}`);
            }
        } catch (error) {
            console.log(`[githubWebhooks.js] Unhandled error: ${error}`);
        }

        res.status(200).send('Webhook received');
    });

    app.listen(port, () => {
        console.log(`[HTTP SERVER] Server listening on port ${port} on "${process.env.github_webhook_endpoint}" endpoint`.cyan);
    });
};