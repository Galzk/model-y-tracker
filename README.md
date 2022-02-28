# Before you start
- Have node 16 (preferably install and use `nvm` [node version manager])

# Setup
1. Search Bot father on telegram, create your bot, copy the token you get
2. Modify `functions/src/index.ts` and put your token at the `token` var
3. Run `cd functions` and `npm i` to install dependencies
4. Go to firebase, create a project
5. Upgrade the project to the pay-as-you-go plan (that's free for this use case, just add a CC)
6. Go to the `FireStore` section and set it up to use in europe somewhere
7. open `.firebaserc` file and put your project-id there (no spaces, it's the name you gave your project)
8. Install firebase-tools with `npm install -g firebase-tools` and run `firebase login`, then after you log in, run `firebase deploy --only functions` to deploy your project

You can also test it using `firebase serve`, then go to the url displayed in the console to start the process

# Interface with Telegram
- Look for the bot you created in Telegram, send him a message
- Open Telegram in the browser, go to your conversation with the bot, copy the chat id from the url (it's the number at the end)
- Open `functions/src/index.ts` and put your chat id in the chatId var