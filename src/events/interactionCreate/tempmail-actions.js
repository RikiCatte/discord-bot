const tempMailSchema = require('../../schemas/tempmail.js');
const tempMailRead = require('../../commands/tempmail/tempmail-read.js');
let tempMailNew = require('../../commands/tempmail/tempmail-new.js');
var progNumber = 0;

module.exports = async (client, interaction) => {
    interactionChannel = interaction.channel;
    const { customId } = interaction;

    if (!interaction.isButton()) return;

    if (!["previous", "x", "next", "custom"].includes(customId)) return;

    let sleep = async (ms) => await new Promise(r => setTimeout(r, ms));
    await sleep(3000);

    const inbox = tempMailRead.sendInbox();
    const interact = tempMailRead.sendInteraction();

    try {
        const query = tempMailSchema.findOne({ Email: inbox, ProgressiveNumber: progNumber });
        const data = await query.exec();

        if (!data) {
            console.log("tempmail-actions error, no data found")
            return interact.editReply("\`❌\` No data found");
        }

        switch (customId) {
            case "previous":
                if (progNumber < 0)
                    return await interact.editReply({ content: 'This is your first email!', ephemeral: true });

                progNumber--;
                await tempMailRead.showData(data.Email, progNumber);

                break;

            case "x":
                return await interact.editReply({ components: [] });

                break;

            case "next":
                if (progNumber == data.MessagesAmount - 1)
                    return await interact.editReply({ content: 'This is your last email!', ephemeral: true });

                progNumber++;
                await tempMailRead.showData(data.Email, progNumber);

                break;
        }
    } catch (e) {
        console.log(e);
    }
}