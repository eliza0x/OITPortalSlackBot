'use strict';

const puppeteer = require('puppeteer');
const req = require('request');

(async() => {
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

  // let my_notices_html = await page.$$('.inner')[2];
  // let college_html = await page.$$('.inner')[3];

  await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});
  const personal_inf = await page.evaluate(() => {
    let html = document.querySelector("div.personal_inf");
    html = Array.from(html.querySelectorAll("div.details"));
    return html.map(e => {
      let date = e.querySelector("div.date > font").innerText;
      let text = e.querySelector("div.text > font > a").innerText;
      return date + ': ' + text;
    })
  });

  const public_inf = await page.evaluate(() => {
    let html = document.querySelector("div.public_inf");
    html = Array.from(html.querySelectorAll("div.details"));
    return html.map(e => {
      let date = e.querySelector("div.date > font").innerText;
      let text = e.querySelector("div.text > font > a").innerText;
      return date + ': ' + text;
    })
  });
  browser.close()

  let text = ""
  text += "個人向けの連絡(eliza0x)\n"
  text += "==========\n"
  personal_inf.forEach(e => text+=e+"\n")
  text += "\n"
  text += "全体向けの連絡\n"
  text += "==========\n"
  public_inf.forEach(e => text+=e+"\n")
  text += "\n"
  text += (new Date()).toString()
  
  // curl -X POST --data-urlencode 'payload={"username": "PortalBot", "text": "いまbot作ってる"}' https://hooks.slack.com/services/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
  
  var options = {
    uri: "https://hooks.slack.com/services/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",
    headers: {
      "Content-type": "application/json",
    },
    json: {
      "username": "PortalBot",
      "text": text
    }
  };
  req.post(options, function(error, response, body){});
})();
