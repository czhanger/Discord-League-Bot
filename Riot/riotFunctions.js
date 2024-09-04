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

module.exports.getPostGameData = async function (gameId) {
  try {
    const postGameData = await fetch(
      `https://americas.api.riotgames.com/lol/match/v5/matches/NA1_${gameId}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    if (postGameData) {
      return postGameData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching post game data", error.message);
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

