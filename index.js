// for token
const dotenv = require("dotenv");
dotenv.config();

// Node file system module to read different directories
const fs = require("node:fs");
// Node path utility module to construct paths to access files and directories
const path = require("node:path");

// Create a new client
// Collection used to store and retrieve commands
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// attaching .commands to client allows us to access commands in other files
client.commands = new Collection();

// construct path to commands directory
const foldersPath = path.join(__dirname, "commands");
// reads the path and returns an array of all the folder names it contains
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  // returns an array of all the .js file names
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  // set each command into client.commands Collection
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // set new item in collection with key as command name and value as exported module
    // check that each command has data and execute properties
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// dynamically retrieve event files from events folder
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Log into Discord with client token
client.login(process.env.DISCORD_TOKEN);
