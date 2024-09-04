const dotenv = require("dotenv");
dotenv.config();

// Create a new client
const { Client, Events, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// runs once when client is ready
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log into Discord with client token
client.login(process.env.DISCORD_TOKEN);
