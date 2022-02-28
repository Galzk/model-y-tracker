import * as admin from 'firebase-admin';
import * as functions from "firebase-functions";
import TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');

admin.initializeApp();

// replace the value below with the Telegram token you receive from @BotFather
const token = 'Put your telegram token here';
const chatId = '674749219';


const DoTheThing = async () => {
  const browserFetcher = puppeteer.createBrowserFetcher();

  let lastMessage = '';
  try {
    // Fetch last message from firestore order by date, limit to one
    const lastMessageQuery = await admin.firestore().collection('last_message').orderBy('timeStamp', 'desc').limit(1).get();
    const lastMessageData = lastMessageQuery.docs[0].data();
    lastMessage = lastMessageData.message;
  } catch {}

  let message = '';
  
  
  const bot = new TelegramBot(token, {polling: false});
  try {
    const revisionInfo = await browserFetcher.download('961656'); // Pinned a specific verstion for puppeteer, this is only required for Firebase functions!

    // init puppeteer
    const browser = await puppeteer.launch({
      executablePath: revisionInfo.executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://www.tesla.com/he_il/api/tesla/header/v1_1');

    // reponse body
    const body = await page.evaluate(() => {
      return document.querySelector('pre').innerHTML;
    });

    // close browser
    await browser.close();

    const parsed = JSON.parse(body);

    if(!parsed.primaryNavigationItems) {
      message = 'No models found';
      if(lastMessage !== message) {
        await bot.sendMessage(chatId, "Something went wrong, didn't get models from API");
      }
    }

    const availableModels = ['Model S', 'Model X', 'Model 3'];
    const unknownModels = parsed.primaryNavigationItems.filter(item => !availableModels.includes(item.title));
    if(unknownModels.length > 0) {
      message = `Got new model ${unknownModels[0].title}`;
      if(lastMessage !== message) {
        await bot.sendMessage(chatId, "😱😱😱 Got an unknown model from Tesla API: " + unknownModels[0].title);
      }
    }
    if(!message) {
      message = `Got same models: ${parsed.primaryNavigationItems.map(item => item.title).join(', ')}`;
      if(lastMessage !== message) {
        await bot.sendMessage(chatId, "🚗🚗🚗 Got models from Tesla API: " + parsed.primaryNavigationItems.map(item => item.title).join(', '));
      }
    }

  } catch (e) {
    console.log(e);
    return e;
  }

  // Use firestore to log the last submitted message
  admin.firestore().collection('last_message').add({
    message,
    timeStamp: new Date()
  });
  return message;
}

exports.getModels = functions.runWith({
  memory: '4GB',
  timeoutSeconds: 60,
}).https.onRequest(async (request, response) => {
  const res = await DoTheThing();

  response.send(res);
});

exports.scheduledFunctionCrontab = functions.runWith({
  memory: '4GB',
  timeoutSeconds: 60,
}).pubsub.schedule('*/5 * * * *') // run every 5 minutes
  .timeZone('Israel')
  .onRun(async (context) => {
    // Run getModels function 
    const res = await DoTheThing();
    return res;
  });
