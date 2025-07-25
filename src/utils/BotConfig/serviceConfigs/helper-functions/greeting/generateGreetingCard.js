const { profileImage } = require("discord-arts");

module.exports = async function generateGreetingCard(user, presenceStatus = "online", borderColor = "#FFFFFF", message = "Hey! <user>") {
    try {
        if (message.includes("<user>")) message = message.replace("<user>", `@${user.username}`)
        
        if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        return await profileImage(user.id, {
            presenceStatus: presenceStatus,
            borderColor: borderColor,
            customTag: message,
            customDate: new Date().toLocaleDateString(),
            customBackground: user.bannerURL({ forceStatic: true })
        });
    } catch (error) {
        console.log("Error generating greeting card:", error);
        throw new Error("Failed to generate greeting card. Please try again later.");
    }
}