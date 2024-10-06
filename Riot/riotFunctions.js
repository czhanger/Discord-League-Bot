const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION = "americas";

const {
  unixToDate,
  getTodaysDate,
  secondsToHours,
  adjustDateIfBefore6AM,
} = require("./utilities");

module.exports.getPuiid = async function (summonerName, tag) {
  try {
    const summonerResponse = await fetch(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${tag}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const summonerData = await summonerResponse.json();
    const summonerId = summonerData.id;
    return summonerData.puuid;
  } catch (error) {
    console.error("Error fetching player status:", error);
    return null;
  }
};

module.exports.getCurrentGame = async function (puuid) {
  try {
    const gameResponse = await fetch(
      `https://na1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const gameData = await gameResponse.json();
    if (!gameResponse.ok) {
      // Handle specific HTTP errors gracefully
      // console.log("No Game, Code:", gameData.status.status_code); // error code for testing
      return null; // Return null to indicate no active game or an error
    }

    return gameData; // Return game data if successfully fetched
  } catch (error) {
    console.error("Error fetching game status:", error.message); // Log only the error message
    return null; // Return null to continue program execution even after an error
  }
};

// Returns
module.exports.getGameData = async function (gameId) {
  try {
    const gameData = await fetch(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    if (gameData) {
      const gameJson = await gameData.json();
      return gameJson;
    }
    return null;
  } catch (error) {
    console.error("Error fetching game data", error.message);
    return null;
  }
};

module.exports.getChampionName = async function (championId) {
  try {
    // fetch latest riot patch
    const versionsResponse = await fetch(
      `https://ddragon.leagueoflegends.com/api/versions.json`
    );
    const latestVersion = (await versionsResponse.json())[0];

    // fetch list of champions
    const championResponse = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
    );
    const championJson = await championResponse.json();
    const championData = Object.values(championJson.data).find(
      (champ) => champ.key === championId
    );
    return championData.name;
  } catch (error) {
    console.error("Error fetching champion data", error);
    return null;
  }
};

module.exports.getSummonerID = async function (puuid) {
  try {
    const accountResponse = await fetch(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const accountData = await accountResponse.json();
    return accountData.id;
  } catch (error) {
    console.error("Error fetching summoner data", error.message);
    return null;
  }
};

module.exports.getRankData = async function (summonerId, queue) {
  try {
    const accountResponse = await fetch(
      `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const rankData = await accountResponse.json();
    // console.log(rankData);
    // returned object holds an object for every game the player has a rank in (lol, tft)
    return rankData.find((game) => game.queueType === queue);
  } catch (error) {
    console.error("Error fetching rank data", error.message);
    return null;
  }
};

// helper function that finds summonerID from name + tag and then returns Rank Data
module.exports.getRankFromNameTag = async function (name, tag, queue) {
  try {
    const puuid = await module.exports.getPuiid(name, tag);
    const summonerId = await module.exports.getSummonerID(puuid);
    return await module.exports.getRankData(summonerId, queue);
  } catch (error) {
    console.error("Error fetching rank data from name tag", error.message);
    return null;
  }
};

// returns formatted rank string
module.exports.formatRankString = async function (name, tag, queue) {
  try {
    const rankData = await module.exports.getRankFromNameTag(name, tag, queue);
    let rankString;
    // if user has no rank information (never played rank/ in placements)
    if (rankData === undefined) {
      rankString = null;
    } else {
      rankString = `${rankData.tier} ${rankData.rank}: ${rankData.leaguePoints} LP`;
    }
    return rankString;
  } catch (error) {
    console.error("Error formatting rank data", error.message);
    return null;
  }
};

// returns a list of match ids
module.exports.getMatchHistory = async function (puuid) {
  try {
    const matchResponse = await fetch(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const matchHistoryData = await matchResponse.json();
    return matchHistoryData;
  } catch (error) {
    console.error("Error fetching match history data", error.message);
    return null;
  }
};

// generate list of games from current day
module.exports.getGamesFromToday = async function (name, tag) {
  const puuid = await module.exports.getPuiid(name, tag);
  const matchHistory = await module.exports.getMatchHistory(puuid);
  const currentDate = getTodaysDate();

  var gameList = [];
  // for match if from current day, add to list
  for (const match of matchHistory) {
    const matchData = await module.exports.getGameData(match);
    const nonAdjustedTime = await unixToDate(matchData.info.gameCreation);
    const adjustedTime = adjustDateIfBefore6AM(nonAdjustedTime);
    if (adjustedTime === currentDate) {
      gameList.push(matchData);
    }
  }
  return gameList;
};

// current game json is different from match history game data
module.exports.getPlayerDataFromCurrentGame = async function (
  name,
  tag,
  currentGame
) {
  const puuid = await module.exports.getPuiid(name, tag);
  try {
    const playerList = Object.entries(currentGame.participants);
    for (const player of playerList) {
      if (player[1].puuid === puuid) {
        return player[1];
      }
    }
  } catch (error) {
    console.error("Error fetching player data from game data", error.message);
    return null;
  }
};

// get individual player data from game data
module.exports.getPlayerDataFromGameData = async function (name, tag, gameId) {
  const puuid = await module.exports.getPuiid(name, tag);
  const gameData = await module.exports.getGameData(gameId);

  try {
    const playerList = Object.entries(gameData.info)[11][1];
    for (const player of playerList) {
      if (player.puuid === puuid) {
        return player;
      }
    }
  } catch (error) {
    console.error("Error fetching player data from game data", error.message);
    return null;
  }
};

// returns W or L
module.exports.getGameResult = async function (name, tag, gameId) {
  const playerGameData = await module.exports.getPlayerDataFromGameData(
    name,
    tag,
    gameId
  );
  try {
    if (playerGameData.win) {
      return "Win";
    } else {
      return "Loss";
    }
  } catch (error) {
    console.error("Error fetching game result", error.message);
    return null;
  }
};

// add up total time spent in games
// returns a string formatted time
module.exports.getTotalGameTime = async function (gameList) {
  var totalTime = 0;

  for (const match of gameList) {
    totalTime += match.info.gameDuration;
  }
  return secondsToHours(totalTime);
};

// search queue object for matching queue type id
module.exports.getQueueFromConfigId = async function (queueTypeConfigID) {
  try {
    const queueTypeResponse = await fetch(
      `https://static.developer.riotgames.com/docs/lol/queues.json`
    );
    const queueTypeJson = await queueTypeResponse.json();
    const queueTypeObject = queueTypeJson.find(
      (queueType) => queueType.queueId === queueTypeConfigID
    );
    return queueTypeObject;
  } catch (error) {
    console.error("Unable to fetch Queue Type ID JSON", error);
  }
};

// takes player's rank object and returns how much that rank is worth
// higher ranks are worth exponentially more than the lowest ranks
module.exports.calculateTradeValue = function (rankData) {
  tierValue = {
    IRON: 0.1,
    BRONZE: 0.5,
    SILVER: 1,
    GOLD: 2,
    PLATINUM: 3.5,
    EMERALD: 5.5,
    DIAMOND: 8,
    MASTER: 11,
    GRANDMASTER: 14.5,
    CHALLENGER: 18.5,
  };

  rankValue = {
    I: 5,
    II: 4,
    III: 3,
    IV: 2,
    V: 1,
  };

  return (
    tierValue[rankData.tier] * rankValue[rankData.rank] * rankData.leaguePoints
  );
};

module.exports.getPlayerRankTradeValue = async function (puuid, queueType) {
  try {
    const summonerId = await module.exports.getSummonerID(puuid);
    const rankData = await module.exports.getRankData(summonerId, queueType);
    return module.exports.calculateTradeValue(rankData);
  } catch (error) {
    console.error("Failed to fetch user's rank trade value", error.message);
  }
};
