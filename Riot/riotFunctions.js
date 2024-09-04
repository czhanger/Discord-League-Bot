const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION = "americas";
const SUMMONER_NAME = "jdawg"; // Replace with the League of Legends username
const TAG = "1337";

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
      console.log("Game:", gameData.status.status_code);
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
    return rankData[0];
  } catch (error) {
    console.error("Error fetching rank data", error.message);
    return null;
  }
};

module.exports.getRankFromNameTag = async function (name, tag) {
  try {
    const puuid = await module.exports.getPuiid(name, tag);
    const summonerId = await module.exports.getSummonerID(puuid);
    return await module.exports.getRankData(summonerId);
  } catch (error) {
    console.error("Error fetching rank data", error.message);
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
  for (const match of matchHistory) {
    const matchData = await module.exports.getGameData(match);
    console.log(matchData.info.gameCreation);
  }
};

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
