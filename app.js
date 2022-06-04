import 'dotenv/config'
import App from '@slack/bolt';
//import index from 'index.js'

// Initializes your app with your bot token and signing secret
const app = new App.App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: false,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN
});

// Listens to incoming messages that contain "hello"
app.message( async ({ message, say }) => {
    // say() sends a message to the channel where the event was triggered
    await say(`Hey there <@${message.user}>! You said ${message}`);
  });

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();