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
  getQueueFromID,
} = require("./Riot/riotFunctions");

const { calcLPChange, createLPStr } = require("./Riot/utilities");
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

      if (gameData) {
        let { gameId } = gameData;
        gameId = "NA1_" + gameId;

        const gameType = getQueueFromID(gameData.gameQueueConfigId);
        console.log("queue id: ", gameType);
        
        let currentGamePlayerData = await getPlayerDataFromCurrentGame(
          name,
          tag,
          gameData
        );

        const playerChampion = await getChampionName(
          "" + currentGamePlayerData.championId // add "" converts num to string
        );

        sendMessageToChannel(
          `${name} (${playerChampion}) just entered the Rift!`,
          client,
          channel
        );

        // Save current rank for comparison
        const currentRank = await formatRankString(name, tag);
        let currentLP = null;

        try {
          currentLP = (await getRankFromNameTag(name, tag)).leaguePoints;
        } catch (error) {
          console.error("No Rank Data", error);
        }

        console.log("-".repeat(20));
        console.log(
          `New Game Started\nPlayer: ${name}\nCurrent Rank: ${currentRank}\nCurrent Game Id: `,
          gameId
        );
        console.log(`Game Start: ${await unixToDate(gameData.gameStartTime)}`);
        console.log("-".repeat(20));

        // Wait until game is over
        while (await getCurrentGame(player_puuid)) {
          if (!botInstances[instanceId]) return; // Check if this instance should stop
          await delay(60000); // Wait 1 minute
        }

        console.log("-".repeat(20));
        console.log(`${name}'s game ended`);
        console.log("-".repeat(20));

        await delay(6000); // Small delay before fetching post-game data

        // Show game result
        const playerGameData = await getPlayerDataFromGameData(
          name,
          tag,
          gameId
        );

        // temp catch for when method randomly fails to fetch puuid
        try {
          const playerScoreString = `Final Score: (${playerChampion}) ${playerGameData.kills} Kills  |  ${playerGameData.deaths} Deaths  |  ${playerGameData.assists} Assists`;
        } catch (error) {
          console.error("Failed to fetch Player Score", error);
        }

        const gameResult = await getGameResult(name, tag, gameId);
        const gameList = await getGamesFromToday(name, tag);
        const gameTimeStr = await getTotalGameTime(gameList);

        const newRank = await formatRankString(name, tag);

        let newLP = null;
        try {
          newLP = (await getRankFromNameTag(name, tag)).leaguePoints;
        } catch (error) {
          console.error("Error fetching new LP", error);
        }

        const LPStr = createLPStr(calcLPChange(newLP, currentLP, gameResult));

        // if rank data is available, show rank change
        let rankChangeString;
        if (currentRank === null || newRank === null) {
          rankChangeString = "No rank data available. Player is in placements.";
        } else {
          rankChangeString = `Rank Change: ${currentRank} -> ${newRank} (${LPStr})`;
        }

        sendMessageToChannel(
          `${"-".repeat(
            40
          )}\n${name}'s game is over...\nGame Result: ${gameResult}\n${playerScoreString}\n${rankChangeString}\n${name} has played ${
            gameList.length
          } game(s) today.\nTotal Game Time: ${gameTimeStr}.\n${"-".repeat(
            40
          )}`,
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
