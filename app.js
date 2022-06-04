import 'dotenv/config'
import App from '@slack/bolt';

// Initializes your app with your bot token and signing secret
const app = new App.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 8000);

  console.log('⚡️ Bolt app is running!');
})();