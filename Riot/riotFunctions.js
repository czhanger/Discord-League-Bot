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

module.exports.getRankData = async function (summonerId) {
  try {
    const accountResponse = await fetch(
      `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const rankData = await accountResponse.json();
    // returned object holds an object for every game the player has a rank in (lol, tft)
    return rankData.find((game) => game.queueType === "RANKED_SOLO_5x5");
  } catch (error) {
    console.error("Error fetching rank data", error.message);
    return null;
  }
};

// helper function that finds summonerID from name + tag and then returns Rank Data
module.exports.getRankFromNameTag = async function (name, tag) {
  try {
    const puuid = await module.exports.getPuiid(name, tag);
    const summonerId = await module.exports.getSummonerID(puuid);
    return await module.exports.getRankData(summonerId);
  } catch (error) {
    console.error("Error fetching rank data from name tag", error.message);
    return null;
  }
};

// returns formatted rank string
module.exports.formatRankString = async function (name, tag) {
  try {
    const rankData = await module.exports.getRankFromNameTag(name, tag);
    let rankString;
    // if user has not rank information (never played rank/ in placements)
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
      return "W";
    } else {
      return "L";
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
