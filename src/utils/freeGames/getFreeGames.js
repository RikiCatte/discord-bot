const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

/**
 * Get the list of free games available from prompted sources (only epic games for now)
 * @returns {Promise<Array<Object>>} - The list of free games
 */
module.exports = async function getFreeGames() {
    try {
        const [epicGames, /*twitchPrimeGames, steamGames*/] = await Promise.all([
            getFreeEpicGames(),
            // getFreePrimeGames(),
            // getFreeSteamGames(),
        ]);

        // Combine all the games from all sources
        return [...epicGames, /*...twitchPrimeGames, ...steamGames*/];
    } catch (error) {
        console.error("ERROR [getFreeGames.js]: ", error);
        return []; // Return an empty array if any API fails
    }
};

/**
 * Get the list of free games available on Epic Games
 * @returns {Promise<Array<Object>>} - The list of free games available on Epic Games
 */
async function getFreeEpicGames() {
    try {
        const response = await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions');
        const games = response.data.data.Catalog.searchStore.elements.filter(game => game.promotions?.promotionalOffers.length > 0);

        return games.map(game => ({
            title: game.title,
            description: game.description,
            url: `https://store.epicgames.com/p/${game.productSlug}`,
            source: 'Epic Games',
            startDate: game.promotions.promotionalOffers[0].promotionalOffers[0].startDate,
            endDate: game.promotions.promotionalOffers[0].promotionalOffers[0].endDate,
            image: game.keyImages.find(img => img.type === 'Thumbnail')?.url, // Add the image if available
        }));
    } catch (error) {
        console.error("ERROR [getFreeEpicGames.js]: ", error);
        return [];
    }
}

/**
 * Get the list of free games available on Twitch Prime
 * @returns {Promise<Array<Object>>} - The list of free games available on Twitch Prime
 */
async function getFreePrimeGames() {
    const url = 'https://gaming.amazon.com/home?filter=Game';
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const games = await page.evaluate(() => {
        const gameElements = document.querySelectorAll('.item-container'); // Selettore per i giochi
        const gameDetails = [];

        gameElements.forEach(game => {
            const title = game.querySelector('.item-title')?.innerText || 'N/A';
            const description = game.querySelector('.item-description')?.innerText || 'N/A';
            const source = 'Twitch Prime';
            const validity = game.querySelector('.item-validity')?.innerText || 'N/A';
            const image = game.querySelector('.item-image img')?.src || 'N/A';

            gameDetails.push({
                title,
                description,
                source,
                validity,
                image
            });
        });

        return gameDetails;
    });

    await browser.close();
    console.log("games: ", games);
    return games;
}

/**
 * Get the list of free games available on Steam
 * @returns {Promise<Array<Object>>} - The list of free games available on Steam
 */
async function getFreeSteamGames() {
    try {
        const browser = await puppeteer.launch({ headless: true }); // We need to use puppeteer instead of axios requests for steamdb
        const page = await browser.newPage();
        await page.goto('https://steamdb.info/upcoming/free/');

        const games = await page.evaluate(() => {
            const gamesList = [];
            const rows = document.querySelectorAll('table.table-hover tbody tr');

            rows.forEach(row => {
                const title = row.querySelector('td:nth-child(2) a')?.innerText.trim();
                const url = 'https://steamdb.info' + row.querySelector('td:nth-child(2) a')?.href;
                const endDate = row.querySelector('td:nth-child(5)')?.innerText.trim();

                if (title && url) {
                    gamesList.push({ title, url, endDate });
                }
            });

            return gamesList;
        });

        await browser.close();
        return games;
    } catch (error) {
        console.error("ERROR [getFreeSteamGames.js]:", error);
        return [];
    }
}