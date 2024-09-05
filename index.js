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

// Riot Test
// League API Wrapper
const {
  getPuiid,
  getCurrentGame,
  getSummonerID,
  formatRankString,
  getPlayerDataFromGameData,
  getGameResult,
  getGamesFromToday,
  getTotalGameTime,
} = require("./Riot/riotFunctions");

const { sendMessageToAll } = require("./defaultChannel");
const { delay } = require("./misc");
const { send } = require("node:process");
const { unixToDate } = require("./Riot/utilities");

const NAME = "Jdawg";
const TAG = "1337";

// ------------------------ Main In Game Player Tracking Function -----------------------

async function gameTrackingBot() {
  try {
    // get current game data
    const player_puuid = await getPuiid(NAME, TAG);

    // const player_puuid = process.env.JDAWG;
    const gameData = await getCurrentGame(player_puuid);
    const summonerId = await getSummonerID(player_puuid);

    // current rank
    const currentRank = await formatRankString(NAME, TAG);

    // if in game
    if (gameData) {
      sendMessageToAll(`${NAME} just entered the Rift!`, client);

      // get current gameId from gameData
      let { gameId } = gameData;
      gameId = "NA1_" + gameId;

      console.log("-".repeat(20));
      console.log("New Game Started\nCurrent Game Id: ", gameId);
      console.log(`Game Start: ${await unixToDate(gameData.gameStartTime)}`);
      console.log("Game in Progress");

      // wait until game is over
      while (await getCurrentGame(player_puuid)) {
        await delay(60000);
      }

      console.log("Game is over.");
      console.log("-".repeat(20));

      // ----------------------- post game info -----------------------------
      await delay(6000);

      // Show game result
      const playerGameData = await getPlayerDataFromGameData(NAME, TAG, gameId);
      const gameResult = await getGameResult(NAME, TAG, gameId);

      // Show number of games played today and total time spent
      const gameList = await getGamesFromToday(NAME, TAG);
      const gameTimeStr = await getTotalGameTime(gameList);
      // Show change in rank
      const newRank = await formatRankString(NAME, TAG);

      sendMessageToAll(
        `${"-".repeat(
          40
        )}\nGame is over...\nGame Result: ${gameResult}\n${NAME} has played ${
          gameList.length
        } games today. Total Game Time: ${gameTimeStr}.\nRank Change: ${currentRank} -> ${newRank}.\n${"-".repeat(
          40
        )}`,
        client
      );
    }
    // ---------------------------------------------------------------------
  } catch (error) {
    console.error("Error in fetching game", error);
  } finally {
    // recurse and check for new game every 120 seconds
    setTimeout(gameTrackingBot, 120000);
  }
}

gameTrackingBot();

// Log into Discord with client token
client.login(process.env.DISCORD_TOKEN);
