import { createPlaywrightRouter } from "crawlee";
import fs from "fs";
import path from "path";


// HÄR ÄR EXPORTEN SOM HUVUDFILEN LÄTAR EFTER!
export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, enqueueLinks, log, request }) => {
    log.info('Laddar sök-sidan...');
    
    await page.waitForSelector('#ctl00_main_txtCompanyName');
    await page.fill('#ctl00_main_txtCompanyName', request.userData.companyName);
    await page.click('#ctl00_main_btnSearch');
    await page.waitForSelector('#ctl00_main_gvwYearReports');

    const rapportElement = await page.locator('#ctl00_main_gvwYearReports');
    const rapportElementTemp = await rapportElement.locator('tr', {hasText: 'Swedish'});
    const countRapports = await rapportElementTemp.count();

    let originalFileName;

    for (let i = 0; i < countRapports; i++) {
        const currentRow = await rapportElementTemp.nth(i);
        const swedishLink = await currentRow.locator('td a', {hasText: 'Swedish'});

        const yearRapport = await currentRow.locator('td').first();
        const yearElement = await yearRapport.textContent();
        const yearText = await yearElement?.trim();
       
        log.debug(`Nedladdning börjar!`)

        try {
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                swedishLink.click()
            ])

            const downloadDir = path.join(process.cwd(), 'downloads');
            
            if(!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, {recursive: true})
            }
            
            if(Number(yearText) <= 2020) {
                originalFileName = `${request.userData.companyName}_${yearText}_${request.userData.isin}.pdf`;
            } else {
                originalFileName = `${request.userData.companyName}_${yearText}_${request.userData.isin}.zip`;
            }

            const targetPath = path.join(downloadDir, originalFileName);

            await download.saveAs(targetPath);
            log.info(`✅ Sparade filen framgångsrikt till: ${targetPath}`);

        } catch (error) {
            log.error(`error: ${error}`)
            process.exit(1);
        }

        log.debug(`year: ${yearText}, link: ${swedishLink}`);
    }
    
    log.info('Sökning klar! Nu visas tabellen på screenen.');
    process.exit(0);
});