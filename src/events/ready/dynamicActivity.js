module.exports = async (client) => {
    const activities = [
        'Colonia meloniana',
        'Scovare le melonie',
        'Picchiare la melonia',
        'Mangiare i cocomeri',
        'Nascondere le melonie'
    ]

    setInterval(() => {
        const status = activities[Math.floor(Math.random() * activities.length)];
        client.user.setPresence({
            activities: [{ name: `${status}` }],
            status: 'dnd',
        });
    }, 10000);
}