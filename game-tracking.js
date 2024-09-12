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
  getQueueIdFromConfigId,
} = require("./Riot/riotFunctions");

const {
  calcLPChange,
  createLPStr,
  createQueueTypeStr,
} = require("./Riot/utilities");
const { sendMessageToAll, sendMessageToChannel } = require("./defaultChannel");
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
      const summonerId = await getSummonerID(player_puuid);
      // check if queue type is a ranked mode
      let isRanked = false;

      if (gameData) {
        let { gameId } = gameData;
        gameId = "NA1_" + gameId;

        // get queue config from current game data and return the correct game mode description
        const gameMode = createQueueTypeStr(
          await getQueueIdFromConfigId(gameData.gameQueueConfigId)
        );

        if (gameMode.includes("RANKED")) {
          isRanked = true;
          console.log("ranked");
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

        sendMessageToChannel(
          `${name} (${playerChampion}) just entered the Rift!\nQueue Type: ${gameMode}`,
          client,
          channel
        );

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
        console.log("-".repeat(40));
        console.log(
          `New Game Started
Player: ${name}
Game Mode: ${gameMode}
${isRanked ? `Current Rank: ${currentRank}\n` : ""}Current Game Id: ${gameId}`
        );
        console.log(`Game Start: ${await unixToDate(gameData.gameStartTime)}`);
        console.log("-".repeat(40));

        // Wait until game is over
        while (await getCurrentGame(player_puuid)) {
          if (!botInstances[instanceId]) return; // Check if this instance has been stopped
          await delay(60000); // Wait 1 minute
        }

        // Log end of game
        console.log("-".repeat(40));
        console.log(`${name}'s game ended`);
        console.log("-".repeat(40));

        await delay(6000); // Small delay before fetching post-game data

        // Show player's game result
        const playerGameData = await getPlayerDataFromGameData(
          name,
          tag,
          gameId
        );

        // temp catch for when method randomly fails to fetch puuid
        let playerScoreString;
        try {
          playerScoreString = `Final Score: (${playerChampion}) ${playerGameData.kills} Kills  |  ${playerGameData.deaths} Deaths  |  ${playerGameData.assists} Assists`;
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
              "No rank data available. Player is in placements.";
          } else {
            rankChangeString = `Rank Change: ${currentRank} -> ${newRank} (${LPStr})\n`;
          }
        }

        sendMessageToChannel(
          `${"-".repeat(40)}
${name}'s game is over...
Game Result: ${gameResult}
${playerScoreString}
${isRanked ? rankChangeString : ""}${name} has played ${
            gameList.length
          } game(s) today.
Total Game Time: ${gameTimeStr}.
${"-".repeat(40)}`,
          client,
          channel
        );
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
