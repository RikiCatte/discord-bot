const BotConfig = require("../../schemas/BotConfig.js");

// cache: key guildId -> { services, ts, serviceTs: Map<string, number> }
const cache = new Map();
const TTL_MS = 60_000;

const now = () => Date.now();
const isFreshTs = (ts) => ts && (now() - ts) < TTL_MS;

/**
 * Ensures that the guildId is provided.
 * @param {String} guildId 
 */
function ensureGuild(guildId) {
    if (!guildId) throw new Error("[configCache] guildId is required");
}

/**
 * Loads entirely or only a part of the configuration from the database.
 * @param {String} guildId 
 * @param {String} serviceName 
 * @returns {Promise<Object|null>}
 */
async function loadFromDb(guildId, serviceName = null) {
    ensureGuild(guildId);

    if (serviceName) {
        console.log(`[ConfigCache][DB FETCH SVC] guild=${guildId} service=${serviceName}`);

        const doc = await BotConfig.findOne(
            { GuildID: guildId },
            { [`services.${serviceName}`]: 1, _id: 0 }
        ).lean();

        return doc?.services?.[serviceName] ?? null;
    }

    console.log(`[ConfigCache][DB FETCH ALL] guild=${guildId}`);
    const doc = await BotConfig.findOne({ GuildID: guildId }).lean();

    return doc?.services ?? null;
}

/**
 * Refreshes entirely or only a part of the configuration cache.
 * @param {String} guildId 
 * @param {String} serviceName 
 * @returns {Promise<void>}
 */
async function refreshAsync(guildId, serviceName = null) {
    ensureGuild(guildId);
    const entry = cache.get(guildId) || { services: {}, ts: 0, serviceTs: new Map() };

    if (serviceName) {
        const svc = await loadFromDb(guildId, serviceName);
        entry.services[serviceName] = svc;

        if (!entry.serviceTs) entry.serviceTs = new Map();

        entry.serviceTs.set(serviceName, now());
        cache.set(guildId, entry);

        console.log(`[ConfigCache][REFRESH SVC DONE] guild=${guildId} service=${serviceName}`);
        return;
    }

    const services = await loadFromDb(guildId, null);
    entry.services = services;
    entry.ts = now();

    if (!entry.serviceTs) entry.serviceTs = new Map();
    cache.set(guildId, entry);

    console.log(`[ConfigCache][REFRESH ALL DONE] guild=${guildId}`);
}

/**
 * Fetches the configuration entirely or only a part of it, using the cache if possible.
 * If the cache is stale, it can return stale data and refresh asynchronously (preferStale=true),
 * or wait for the fresh data (preferStale=false).
 * @param {String} guildId 
 * @param {String} serviceName 
 * @param {Object} options 
 * @param {Boolean} options.preferStale - if true (default) returns stale data and refreshes async, if false waits for fresh data
 * @returns {Promise<Object|null>} - entire services object or single service object or null if not found
 */
async function getConfig(guildId, serviceName = null, options = { preferStale: true }) {
    ensureGuild(guildId);
    const preferStale = options?.preferStale !== false;
    const entry = cache.get(guildId);

    if (serviceName) {
        const svcTs = entry?.serviceTs?.get(serviceName);

        if (entry && isFreshTs(svcTs)) {
            console.log(`[ConfigCache][HIT SVC] guild=${guildId} service=${serviceName}`);
            return entry.services?.[serviceName] ?? null;
        }

        if (entry && preferStale && entry.services?.hasOwnProperty(serviceName)) {
            console.log(`[ConfigCache][STALE SVC] guild=${guildId} service=${serviceName} -> serve stale & refresh async`);
            refreshAsync(guildId, serviceName).catch(err =>
                console.error(`[ConfigCache][REFRESH SVC ERR] guild=${guildId} service=${serviceName}`, err)
            );
            return entry.services[serviceName];
        }

        console.log(`[ConfigCache][MISS SVC] guild=${guildId} service=${serviceName}`);
        const svc = await loadFromDb(guildId, serviceName);

        const e = entry || { services: {}, ts: 0, serviceTs: new Map() };
        e.services[serviceName] = svc;
        if (!e.serviceTs) e.serviceTs = new Map();
        e.serviceTs.set(serviceName, now());

        cache.set(guildId, e);
        return svc;
    }

    if (entry && isFreshTs(entry.ts)) {
        console.log(`[ConfigCache][HIT ALL] guild=${guildId}`);
        return entry.services;
    }

    if (entry && preferStale) {
        console.log(`[ConfigCache][STALE ALL] guild=${guildId} -> serve stale & refresh async`);
        refreshAsync(guildId, null).catch(err =>
            console.error(`[ConfigCache][REFRESH ALL ERR] guild=${guildId}`, err)
        );
        return entry.services;
    }

    console.log(`[ConfigCache][MISS ALL] guild=${guildId}`);

    const services = await loadFromDb(guildId, null);
    cache.set(guildId, { services, ts: now(), serviceTs: new Map() });

    return services;
}

/**
 * Invalidates entirely or only a part of the configuration cache.
 * @param {String} guildId 
 * @param {String} serviceName
 */
function invalidateCache(guildId, serviceName = null) {
    ensureGuild(guildId);

    if (!serviceName) {
        const had = cache.has(guildId);
        cache.delete(guildId);
        console.log(`[ConfigCache][INVALIDATE ALL] guild=${guildId} existed=${had}`);
        return;
    }

    const entry = cache.get(guildId);
    if (!entry) {
        console.log(`[ConfigCache][INVALIDATE SVC] guild=${guildId} service=${serviceName} existed=false`);
        return;
    }

    if (entry.services) delete entry.services[serviceName];
    if (!entry.serviceTs) entry.serviceTs = new Map();

    const hadTs = entry.serviceTs.delete(serviceName);
    console.log(`[ConfigCache][INVALIDATE SVC] guild=${guildId} service=${serviceName} existed=${hadTs}`);
}

module.exports = {
    getConfig,
    refreshAsync,
    invalidateCache,
};