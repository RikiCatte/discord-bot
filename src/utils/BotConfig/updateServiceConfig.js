module.exports = async function updateServiceConfig(config, service, updates) {
    if (!config.services[service]) config.services[service] = {};
    for (const [key, value] of Object.entries(updates)) {
        config.services[service][key] = value;
    }
    await config.save();
}