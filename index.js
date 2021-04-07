const puppeteer = require("puppeteer");
const url = require('url');
const fs = require("fs");
const $ = require('cheerio');
const clipboardy = require('clipboardy');


const start = async () => {
    console.log("если что не робит писать мне, не пытайтесь что-то починить сами");

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        headless: false
    });

    const newPage = async () => {
        const solutions = require("./solutions.json");

        const page = await browser.newPage();

        if (!Object.keys(solutions).length) {
            console.log("Hello начинаем копирования заданий на ваше устройство");

            await login(page, "tanka.bocharova.23@gmail.com", "NoviyOrlean53281TB7");

            await copySolutions(page);

            await page.close();

            await newPage();

        } else {

            await login(page, "Hronologos227", "cktdfujhs");

            await pasteSolutionInAccount(page);

            await page.close();
        }
    }

    await newPage();

    await browser.close();
}


const pasteSolutionInAccount = async (page) => {
    await page.waitForSelector('a.course-card');

    const links = await page.evaluate(() =>
        Array.from(
            document.querySelectorAll('a.course-card'), (element) => {
                return "https://lyceum.yandex.ru" + element.getAttribute("href");
            }
        )
    )

    await page.goto(links[2], {
        waitUntil: "networkidle0"
    });

    const lessonLinks = await page.evaluate(() =>
        Array.from(
            document.querySelectorAll('a.link-list__link'), (element) => {
                return "https://lyceum.yandex.ru" + element.getAttribute("href");
            }
        )
    )

    for (let k of lessonLinks) {
        console.log(k);
        await page.goto(k, {
            waitUntil: "networkidle0"
        });
        const taskLinks = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll('a.student-task-list__task'), (element) => {
                    return "https://lyceum.yandex.ru" + element.getAttribute("href");
                }
            )
        )

        for (let i of taskLinks) {
            await page.goto(i, {
                waitUntil: "networkidle2"
            });

            if (!page.url().includes("solutions")) {
                console.log("not solutions works");


                const solutionPage = await page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll('a.Button2_view_lyceum'), (element) => {
                            return "https://lyceum.yandex.ru" + element.getAttribute("href");
                        }
                    )
                )

                console.log(solutionPage[0]);

                await page.goto(solutionPage[0], {
                    waitUntil: "networkidle0"
                });

                // const taskSolution = await page.evaluate(() => {
                //     return document.querySelector('.CodeMirror-line > span')
                // })

                const taskName = await page.evaluate(() => {
                    return document.querySelector('h1').innerText
                })

                await page.click(".code-editor__control-button");


                try {
                    console.log(taskName, solutions[taskName]);
                } catch (e) {
                    console.log(e);
                }

                await clipboardy.write(solutions[taskName].replace(/[\u200B-\u200D\uFEFF]/g, ''));

                await page.click('.CodeMirror-lines');

                await page.keyboard.down('Control')
                await page.keyboard.press('V')
                await page.keyboard.up('Control')

                await page.click(".layout__main .Button2_view_lyceum");

            } else {
                console.log("мы наткнулись на не пусторе решение");
            }
        }

        console.log("Все сделано");
    }

}

const login = async (page, login, password) => {
    await page.goto("https://passport.yandex.ru/auth?origin=lyceum&retpath=https%3A%2F%2Flyceum.yandex.ru%2F", {
        waitUntil: "networkidle0"
    })

    await page.type("#passp-field-login", login, {
        delay: 30
    });

    await page.click(".Button2_type_submit");

    await page.waitFor(1000);

    await page.type("#passp-field-passwd", password, {
        delay: 30
    });

    await page.click(".Button2_type_submit");
}

const copySolutions = async (page) => {
    await page.waitForSelector('a.course-card');

    const links = await page.evaluate(() =>
        Array.from(
            document.querySelectorAll('a.course-card'), (element) => {
                return "https://lyceum.yandex.ru" + element.getAttribute("href");
            }
        )
    )

    await page.goto(links[1], {
        waitUntil: "networkidle0"
    });

    const lessonLinks = await page.evaluate(() =>
        Array.from(
            document.querySelectorAll('a.link-list__link'), (element) => {
                return "https://lyceum.yandex.ru" + element.getAttribute("href");
            }
        )
    )

    console.log(lessonLinks);

    for (let k of lessonLinks) {
        console.log(k);
        await page.goto(k, {
            waitUntil: "networkidle0"
        });
        const taskLinks = await page.evaluate(() =>
            Array.from(
                document.querySelectorAll('a.student-task-list__task'), (element) => {
                    return "https://lyceum.yandex.ru" + element.getAttribute("href");
                }
            )
        )

        for (let i of taskLinks) {
            await page.goto(i, {
                waitUntil: "networkidle2"
            });

            if (page.url().includes("solutions")) {
                console.log("works");
                const taskSolution = await page.evaluate(() =>
                    Array.from(
                        document.querySelectorAll('.CodeMirror-line > span'), (element) => {
                            return element.innerText;
                        }
                    )
                )

                const taskName = await page.evaluate(() => {
                    return document.querySelector('h1').innerText
                })

                let finalTaskSolution = ""

                for (let j of taskSolution) {
                    finalTaskSolution += j + "\n"
                }

                console.log(finalTaskSolution);

                solutions[taskName] = finalTaskSolution;

                fs.writeFileSync("solutions.json", JSON.stringify(solutions), function writeJSON(err) {
                    console.log("writing...");
                    if (err) return console.log(err);
                });

            } else {
                console.log("мы наткнулись на пусторе решение");
            }
        }
    }
}

start();