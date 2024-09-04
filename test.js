const dotenv = require("dotenv");
dotenv.config();
NAME = "jdawg";
TAG = "1337";
const {
  getRankFromNameTag,
  getPuiid,
  getMatchHistory,
  getGamesFromToday,
  getSummonerID,
  getGameData,
  getPlayerDataFromGameData,
  getGameResult,
} = require("./Riot/riotFunctions");

async function main() {
  const rankData = await getRankFromNameTag(NAME, TAG);
  const puuid = await getPuiid(NAME, TAG);
  const summonerId = await getSummonerID(puuid);

  //   await getGamesFromToday("jdawg", "1337");
  //   console.log(rankData);
  //   const gameData = await getGameData("NA1_5104118758");
  //   console.log(Object.entries(gameData.info)[11][1][0].summonerId);
  //   await getPlayerDataFromGameData("jdawg", "1337", "NA1_5104135919");
  await getGameResult(NAME, TAG, "NA1_5104135919");
}

main();
