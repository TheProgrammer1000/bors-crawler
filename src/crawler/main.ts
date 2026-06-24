// For more information, see https://crawlee.dev/
import { Browser, ImpitHttpClient } from '@crawlee/impit-client';
import { PlaywrightCrawler, ProxyConfiguration, log } from 'crawlee';

import { router } from './routes.js';

const startUrls = ['https://finanscentralen.fi.se/search/Search.aspx'];

// This is better set with CRAWLEE_LOG_LEVEL env var
// or a configuration option. This is just for show 😈
log.setLevel(log.LEVELS.DEBUG);

log.debug('Setting up crawler.');


  // {isin: 'SE0007130083', name: 'HANZA'},
// 1. Behåll array-formatet [] men ha bara ETT bolag i listan
const companiesToScrape = [
    {isin: 'SE0007130083', name: 'HANZA'},
    // { isin: 'SE0000115446', name: 'Aktiebolaget Volvo' }
];

// 2. Vi mappar precis som innan, så att startRequests blir en array
const startRequests = companiesToScrape.map(company => ({
    url: 'https://finanscentralen.fi.se/search/Search.aspx',
    uniqueKey: `search-${company.isin}`, 
    userData: {
        isin: company.isin,
        companyName: company.name 
    }
}));

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    httpClient: new ImpitHttpClient({ browser: Browser.Chrome }),
    requestHandler: router,

    launchContext: {
        launchOptions: {
            headless: false, 
        }
    },
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 20,
    navigationTimeoutSecs: 120,
    requestHandlerTimeoutSecs: 120,
});

await crawler.run(startRequests);
