'use strict';

const puppeteer = require('puppeteer');
const req = require('request');
const fs = require('fs');

function readLog() {
  return JSON.parse(fs.readFileSync('log.json', 'utf8'))
}

function writeLog(obj) {
  return fs.writeFileSync('log.json', JSON.stringify(obj))
}

function postSlack(text) {
    const options = httpOption(text)
    req.post(options, function(error, response, body){});
}

function httpOption(text) {
  return {
    uri: "https://hooks.slack.com/services/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",
    headers: {
      "Content-type": "application/json",
    },
    json: {
      "username": "PortalBot",
      "text": text
    }
  };
}

(async() => { 
  try {
    const browser = await puppeteer.launch({
      ignoreSSL: true,
      headless: true
      //headless: false
    });
    const page = await browser.newPage();
    await page.goto('http://www.portal.oit.ac.jp/portal/top.do');
    await page.type('#userId', process.env.OIT_USERNAME);
    await page.type('#password', process.env.OIT_PASSWD);
    await page.click('#loginButton');
    await page.waitFor(10000);

    const personal_inf = await page.evaluate(() => {
      let html = document.querySelector("div.personal_inf");
      html = Array.from(html.querySelectorAll("div.details"));
      return html.map(e => {
        let date = e.querySelector("div.date > font").innerText;
        let text = e.querySelector("div.text > font > a").innerText;
        return date + ': ' + text;
      });
    });
  
    const public_inf = await page.evaluate(() => {
      let html = document.querySelector("div.public_inf");
      html = Array.from(html.querySelectorAll("div.details"));
      return html.map(e => {
        let date = e.querySelector("div.date > font").innerText;
        let text = e.querySelector("div.text > font > a").innerText;
        return date + ': ' + text;
      });
    });
    browser.close()
  
    const log = readLog()
    let new_personal_inf = []
    let new_public_inf = []

    personal_inf.forEach (e => {
      let new_arrayvals = true
      log.personal_inf.forEach (le => {
        if (e == le) new_arrayvals = false
      })
      if (new_arrayvals) new_personal_inf.push(e)
    })

    public_inf.forEach (e => {
      let new_arrayvals = true
      log.public_inf.forEach (le => {
        if (e == le) new_arrayvals = false
      })
      if (new_arrayvals) new_public_inf.push(e)
    })

    writeLog({personal_inf: personal_inf, public_inf: public_inf})


    if (new_personal_inf.length > 0 || new_public_inf.length > 0) {
      let text = "新しい通知を検知:\n"
      if (new_personal_inf.length >= 0) {
        text += "個人向けの連絡(eliza0x)\n"
        text += "==========\n"
        new_personal_inf.forEach(e => text+=e+"\n")
        text += "\n"
      }
      if (new_public_inf.length >= 0) {
        text += "全体向けの連絡\n"
        text += "==========\n"
        new_public_inf.forEach(e => text+=e+"\n")
        text += "\n"
      }
      postSlack(text)
    }
  } catch (e) {
    postSlack("情報の取得に失敗\n==========\n" + e.toString())
  }
})();

// curl -X POST --data-urlencode 'payload={"username": "PortalBot", "text": "いまbot作ってる"}' https://hooks.slack.com/services/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
