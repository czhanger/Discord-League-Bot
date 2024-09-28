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
  getRankFromNameTag,
  getChampionName,
  getPlayerDataFromCurrentGame,
  getQueueFromConfigId,
} = require("./Riot/riotFunctions");

const {
  calcLPChange,
  createLPStr,
  createQueueTypeStr,
} = require("./Riot/utilities");

const { EmbedBuilder } = require("discord.js");
const {
  sendMessageToAll,
  sendMessageToChannel,
  sendEmbedToChannel,
} = require("./defaultChannel");
const { delay } = require("./misc");
const { unixToDate } = require("./Riot/utilities");

// ------------------------ Main In Game Player Tracking Function -----------------------

// Object to manage control flags for each instance
// Object of trackers
const botInstances = {};

module.exports.gameTrackingBot = async function (
  name,
  tag,
  client,
  channel,
  instanceId
) {
  // Initialize control flag for this instance
  botInstances[instanceId] = true;
  console.log(`Player List: ${Object.keys(botInstances)}`);
  try {
    while (botInstances[instanceId]) {
      // Continue only if this instance is running
      // Get current game data
      const player_puuid = await getPuiid(name, tag);
      const gameData = await getCurrentGame(player_puuid);
      // check if queue type is a ranked mode
      let isRanked = false;

      const strDivider = "-".repeat(40);

      if (gameData) {
        let { gameId } = gameData;
        gameId = "NA1_" + gameId;

        // get queue config from current game data and return the correct game mode description
        const queueObject = await getQueueFromConfigId(
          gameData.gameQueueConfigId
        );

        // get queue description string to be sent as part of game start notification
        let queueDescription;
        try {
          queueDescription = queueObject.description;
          // Riot descriptions end each queue type with "games"
          // remove that final word
          const words = queueDescription.trim().split(" ");
          words.pop();
          queueDescription = words.join(" ");
        } catch (error) {
          console.error("Error accessing queue description", error);
        }

        const gameMode = createQueueTypeStr(queueObject); // current game mode, used to check if player is in ranked

        if (gameMode.includes("RANKED")) {
          isRanked = true;
        }

        // get player's data from current game
        let currentGamePlayerData = await getPlayerDataFromCurrentGame(
          name,
          tag,
          gameData
        );

        const playerChampion = await getChampionName(
          "" + currentGamePlayerData.championId // add "" converts num to string
        );

        const newGameEmbed = new EmbedBuilder()
          .setTitle(`${name} (${playerChampion}) just entered the Rift!`)
          .setAuthor({ name: "Game Found!" })
          .addFields({ name: "**Game Mode:**", value: `${queueDescription}` })
          .setColor("#237feb");

        sendEmbedToChannel(newGameEmbed, client, channel);

        //         sendMessageToChannel(
        //           `${strDivider}
        // ${name} (${playerChampion}) just entered the Rift!
        // Game Type: ${queueDescription}`,
        //           client,
        //           channel
        //         );

        // Save current rank for comparison
        let currentRank;
        let currentLP = null;
        if (isRanked) {
          currentRank = await formatRankString(name, tag, gameMode);
          try {
            currentLP = (await getRankFromNameTag(name, tag, gameMode))
              .leaguePoints;
          } catch (error) {
            console.error("No Rank Data", error);
          }
        }

        // Log New Game Info
        console.log(strDivider);
        console.log(
          `New Game Started
Player: ${name}
Game Mode: ${gameMode}
${isRanked ? `Current Rank: ${currentRank}\n` : ""}Current Game Id: ${gameId}`
        );
        console.log(`Game Start: ${await unixToDate(gameData.gameStartTime)}`);
        console.log(strDivider);

        // Wait until game is over
        while (await getCurrentGame(player_puuid)) {
          if (!botInstances[instanceId]) return; // Check if this instance has been stopped
          await delay(60000); // Wait 1 minute
        }

        // Log end of game
        console.log(strDivider);
        console.log(`${name}'s game ended`);
        console.log(strDivider);

        await delay(6000); // Small delay before fetching post-game data

        // Player's game result
        const playerGameData = await getPlayerDataFromGameData(
          name,
          tag,
          gameId
        );

        // temp catch for when method randomly fails to fetch puuid
        let playerScoreString = "";
        try {
          playerScoreString = `${playerGameData.kills}/${playerGameData.deaths}/${playerGameData.assists} KDA`;
        } catch (error) {
          console.error("Failed to fetch Player Score", error);
        }

        const gameResult = await getGameResult(name, tag, gameId); // win or loss
        const gameList = await getGamesFromToday(name, tag); // list of games from today
        const gameTimeStr = await getTotalGameTime(gameList); // total game time in hours, mins, seconds

        let newRank;
        let newLP = null;
        let rankChangeString;
        let LPStr;

        // create LP change string and Rank change string
        if (isRanked) {
          try {
            newRank = await formatRankString(name, tag, gameMode);
            newLP = (await getRankFromNameTag(name, tag, gameMode))
              .leaguePoints;
          } catch (error) {
            console.error("Error fetching new LP", error);
          }

          LPStr = createLPStr(calcLPChange(newLP, currentLP, gameResult)); // shows LP change (+/-)

          // if rank data is available, show rank change
          if (currentRank === null || newRank === null) {
            rankChangeString =
              "No rank data available. Player is in placements.\n";
          } else {
            // if there was no division jump, don't show the division name twice
            if (currentRank.split(":")[0] === newRank.split(":")[0]) {
              rankChangeString = `Rank Change: ${currentRank} -> ${newLP} (${LPStr})\n`;
            } else {
              rankChangeString = `Rank Change: ${currentRank} -> ${newRank} (${LPStr})\n`;
            }
          }
        }

        // Send post game report to discord

        postGameEmbed = new EmbedBuilder()
          .setTitle(`${name} (${playerChampion}) ${gameResult}`)
          .setAuthor({ name: "Game Over..." })
          .addFields({ name: "**KDA:**", value: `${playerScoreString}` });

        if (isRanked) {
          postGameEmbed.addFields({
            name: "**Rank Change:**",
            value: `${rankChangeString}`,
          });
        }

        postGameEmbed.addFields({
          name: "Time Spent",
          value: `${gameList.length} game(s) played today for ${gameTimeStr}`,
        });

        if (gameResult == "Win") {
          postGameEmbed.setColor("#00b12c");
        } else {
          postGameEmbed.setColor("#d30000");
        }

        sendEmbedToChannel(postGameEmbed, client, channel);
        //         sendMessageToChannel(
        //           `${strDivider}
        // ${name}'s (${playerChampion}) game is over...
        // Game Result: ${gameResult} -- ${playerScoreString}
        // ${isRanked ? rankChangeString : ""}${
        //             gameList.length
        //           } game(s) played today for ${gameTimeStr}`,
        //           client,
        //           channel
        //         );
      }

      // Delay before next check
      console.log(`${name} not in game`);
      await delay(60000); // Check for new game every 120 seconds
    }
  } catch (error) {
    console.error(`Error in fetching game for instance ${instanceId}`, error);
  }
};

// Function to stop a specific instance of the game tracking bot
module.exports.stopGameTrackingBot = async function (instanceId) {
  if (botInstances[instanceId]) {
    botInstances[instanceId] = false; // Set the control flag to false for this instance
    delete botInstances[instanceId]; // Clear instance after stopping
    console.log(`Game tracking bot instance ${instanceId} has been stopped.`);
  } else {
    console.log(
      `Instance ${instanceId} is not running or has already been stopped.`
    );
  }
};

// checks if instance already exists
module.exports.checkBotInstances = function (instanceId) {
  return botInstances[instanceId] === true;
};
