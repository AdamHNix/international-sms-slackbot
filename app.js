import 'dotenv/config'
import App from '@slack/bolt';

// Initializes your app with your bot token and signing secret
const app = new App.App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
    // say() sends a message to the channel where the event was triggered
    await say(`Hey there <@${message.user}>!`);
  });

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();