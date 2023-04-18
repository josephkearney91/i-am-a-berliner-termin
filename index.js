const open = require('open');

const fs = require('fs');
const puppeteer = require('puppeteer');
const config = {
    'debug': false,
    'logFile': 'logFile.txt'
};

const staticConfig = {
    'entryUrl': 'https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&anliegen[]=120686&dienstleisterlist=122210,122217,327316,122219,327312,122227,327314,122231,327346,122243,327348,122252,329742,122260,329745,122262,329748,122254,329751,122271,327278,122273,327274,122277,327276,122280,327294,122282,327290,122284,327292,327539,122291,327270,122285,327266,122286,327264,122296,327268,150230,329760,122301,327282,122297,327286,122294,327284,122312,329763,122304,327330,122311,327334,122309,327332,122281,327352,122279,329772,122276,327324,122274,327326,122267,329766,122246,327318,122251,327320,122257,327322,122208,327298,122226,327300',
};

var minutes = 1;
var the_interval = minutes * 60 * 1000;


(async() => {
    if(shouldBook()){
        console.log('----');
        console.log('Starting: ' + new Date(Date.now()).toTimeString());


        setInterval(function() {
            console.log("I am doing a termin check!");
            bookTermin();
        }, the_interval);
    }
})();

function shouldBook() {
    if(!fs.existsSync(config.logFile)){
        return true;
    } else {
        return false;
    }
}


async function bookTermin() {
    const browser = await puppeteer.launch({
  		headless: !config.debug,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
  	});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
            req.abort();
        } else {
            req.continue();
        }
    });

    let success = false;

    try{
        await page.goto(staticConfig.entryUrl);

        await page.waitForSelector('div.span7.column-content', { timeout: 120000 });

        // Check if there are Termins available
        let available = (await page.$$('td.buchbar')).length;
        // If no Termins available, move to next month
        if(available == 0){
	       console.log('no termins available right now!');
        }
        console.log('Available Termins: ' + available);

        // If there are bookable Termins
        if(available > 0){
            //make a noise
            console.log("\007");
            let dates = await page.$$('td.buchbar');
            for(let i=0;i<available;i++){
                let link = await dates[i].$eval('a', el => el.getAttribute('href'));
                console.log('Link ' + i + ': ' + link);

                //open the link in the browser
                await open('https://service.berlin.de' + link);

            }
        }
        success = true;
    } catch (err) {
        console.log(err);
    }
    browser.close();
    return success;
}
