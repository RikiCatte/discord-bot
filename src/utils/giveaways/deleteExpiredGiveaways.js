const giveawaySchema = require("../../schemas/giveaways");

module.exports = async () => {
    try {
        const giveaways = await giveawaySchema.find({});
        const expirationTime = new Date(Date.now() - 3 * 60 * 1000);

        giveaways.forEach(async (giveaway) => {
            if (giveaway.Ended) {
                await giveawaySchema.deleteMany({
                    updatedAt: { $lte: expirationTime },
                });

                return;
            }
        });
    } catch (error) {
        console.log(error);
    }
}