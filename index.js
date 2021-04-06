const puppeteer = require("puppeteer");
const url = require('url');
const fs = require("fs");
const $ = require('cheerio');
const cookies = require("./cookies.json");

(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: false
    });

    const page = await browser.newPage();

    if (Object.keys(cookies).length) {

        await page.setCookie(...cookies);

        await page.goto("https://lyceum.yandex.ru/", {waitUntil: "networkidle0"});

        const links = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll('a.course-card'), (element) => {
                    return "https://lyceum.yandex.ru" + element.getAttribute("href");
                }
            )
        )

        await page.goto(links[2], {waitUntil: "networkidle0"});

        const lessonLinks = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll('a.link-list__link'), (element) => {
                    return "https://lyceum.yandex.ru" + element.getAttribute("href");
                }
            )
        )

        await page.goto(lessonLinks[2], {waitUntil: "networkidle0"});

        const taskLinks = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll('a.student-task-list__task'), (element) => {
                    return "https://lyceum.yandex.ru" + element.getAttribute("href");
                }
            )
        )

        await page.goto(taskLinks[2], {waitUntil: "networkidle2"});

        if (page.url().includes("solutions")) {
            const taskSolution = await page.evaluate(() =>
                Array.from(
                    document.querySelectorAll('.CodeMirror-line > span'), (element) => {
                        return element.innerText;
                    }
                )
            )

            taskSolution.forEach(item => {
                console.log(item);
            })
        }


        await page.waitFor(10000)




    } else {

        await page.goto("https://passport.yandex.ru/auth?origin=lyceum&retpath=https%3A%2F%2Flyceum.yandex.ru%2F", { waitUntil: "networkidle0"})

        await page.type("#passp-field-login", "Hronologos227", {delay: 30});

        await page.screenshot({ path: 'example.png' });

        await page.click(".Button2_type_submit");

        await page.waitFor(1000);

        await page.type("#passp-field-passwd", "cktdfujhs", {delay: 30});

        await page.click(".Button2_type_submit");

        await page.waitFor(15000);

        let currentCookies = await page.cookies();

        fs.writeFileSync("./cookies.json", JSON.stringify(currentCookies));
    }

    await browser.close();
})();