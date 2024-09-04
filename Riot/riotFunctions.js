const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION = "americas";
const SUMMONER_NAME = "jdawg"; // Replace with the League of Legends username
const TAG = "1337";

module.exports.getPuiid = async function (summonerName, tag) {
  try {
    const summonerResponse = await fetch(
      `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${tag}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      }
    );
    const summonerData = await summonerResponse.json();
    const summonerId = summonerData.id;
    return summonerData.puuid;
  } catch (error) {
    console.error("Error fetching player status:", error);
  }
};
