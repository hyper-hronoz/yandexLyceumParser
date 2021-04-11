const puppeteer = require("puppeteer");
const url = require('url');
const reader = require('readline-sync');
const fs = require("fs");
const clipboardy = require('clipboardy');
const base64 = require('base-64');
const utf8 = require('utf8');

const start = async () => {
    console.log("если что не робит писать мне, не пытайтесь что-то починить сами");

    const browser = await puppeteer.launch({
        headless: false
    });

    const newPage = async () => {
        const solutions = require("./solutions.json");

        const page = await browser.newPage();

        if (!Object.keys(solutions).length) {
            // console.log("Hello начинаем копирования заданий на ваше устройство");

            // await copySolutions(page);

            // await page.close();

            // await newPage();

        } else {

            // await formateCode(browser);

            // await login(page, reader.question("login: "), reader.question("password: "));
            await login(page, "Hronologos227", "cktdfujhs");

            await pasteSolutionInAccount(page, solutions, browser);

            await page.close();
        }
    }

    await newPage();

    await browser.close();
}


const pasteSolutionInAccount = async (page, solutions, browser) => {

    await page.waitForSelector('a.course-card');

    console.log("вы залогинились");

    const links = await page.evaluate(() =>
        Array.from(
            document.querySelectorAll('a.course-card'), (element) => {
                return "https://lyceum.yandex.ru" + element.getAttribute("href");
            }
        )
    )

    console.log("Ссылки на курсы: ", links);

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

    lessonLinks.shift(); 
    lessonLinks.shift(); 
    lessonLinks.shift(); 
    lessonLinks.shift(); 
    lessonLinks.shift(); 
    lessonLinks.shift(); 
    lessonLinks.shift(); 
    lessonLinks.shift(); 

    console.log("Ссылки на уроки", lessonLinks);

    for (let k of lessonLinks) {
        if (!k.includes("null")) {
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

            console.log("Ссылки на задачи", taskLinks);

            for (let i of taskLinks) {
                console.log(i);
                await page.goto(i, {
                    waitUntil: "networkidle0"
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

                    if (!solutionPage[0].includes("null")) {
                        await page.goto(solutionPage[0], {
                            waitUntil: "networkidle0"
                        });

                        try {
                            await appendSolution(page, solutions);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                } else {
                    try {
                        const taskStatus = await page.evaluate(() => {
                            return document.querySelector('.solution-status-viewer__status-text').innerText
                        })

                        if (taskStatus == "Доработать") {
                            await appendSolution(page, solutions); 
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    }
    console.log("Все сделано");

}

const appendSolution = async (page, solutions) => {

    const taskName = await page.evaluate(() => {
        return document.querySelector('h1').innerText
    })

    console.log(taskName);

    if (solutions[taskName]) {

        console.log("Ща менять будем");

        let finalTaskSolution = await solutions[taskName].replace(/[\u200B-\u200D\uFEFF]/g, '');

        console.log(finalTaskSolution);

        finalTaskSolution = await obfuscate(finalTaskSolution);

        await clipboardy.write(finalTaskSolution);

        await page.click(".code-editor__control-button");

        await page.click('.CodeMirror-lines');

        await page.keyboard.down('Control');

        await page.keyboard.press('a');

        await page.keyboard.press('Backspace');

        await page.keyboard.up('Control');

        await page.keyboard.down('Control');

        await page.keyboard.press('v');

        await page.keyboard.up('Control');

        await page.waitFor(10000);

        // await page.click(".layout__main .Button2_view_lyceum");
    } else {
        console.log("В бд не найдено такое решение");
    }
}

const obfuscate = async (finalTaskSolution) => {
    const bytes = utf8.encode(finalTaskSolution);
    finalTaskSolution = base64.encode(bytes);
    const array = finalTaskSolution.match(/.{1,50}/g);
    let pythonString = '';
    for (let i = 0; i < array.length; i++) {
        if (!(i == 0)) {
            pythonString += "         ";
        }
        pythonString += `b'${array[i]} '`
        if (!(i == array.length - 1)) {
            pythonString += "\\\n"
        }
    }
    console.log(pythonString);
    return `
from base64 import b64encode, b64decode

hidden = ${pythonString}

eval(compile(b64decode(hidden.decode()), "<string>", "exec"))
    `;
}

const formateCode = async (browser) => {
    const page = await browser.newPage();

    await page.goto("https://codebeautify.org/python-formatter-beautifier", {
        waitUntil: "networkidle0"
    });

    await page.click("#inputDiv .ace_active-line");

    await page.keyboard.down('Control')

    await page.keyboard.press('a')

    await page.keyboard.press('Backspace')

    await page.keyboard.up('Control')

    await page.keyboard.down('Control')

    await page.keyboard.press('v')

    await page.keyboard.up('Control')

    await page.click("#defaultAction")

    await page.waitFor(2000);

    await page.click('#outputDiv .ace_active-line');

    await page.keyboard.down('Control');

    await page.keyboard.press('a');

    await page.keyboard.press('x');

    await page.keyboard.up('Control');

    await page.close();

}

const login = async (page, login, password) => {
    await page.goto("https://passport.yandex.ru/auth?origin=lyceum&retpath=https%3A%2F%2Flyceum.yandex.ru%2F", {
        waitUntil: "networkidle0"
    })

    await page.type("#passp-field-login", login, {
        delay: 1
    });

    await page.click(".Button2_type_submit");

    await page.waitFor(400);

    await page.type("#passp-field-passwd", password, {
        delay: 1
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