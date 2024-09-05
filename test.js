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
  formatRankString,
} = require("./Riot/riotFunctions");

const { getTodaysDate } = require("./Riot/utilities");
async function main() {
  const rankData = await getRankFromNameTag(NAME, TAG);
  const puuid = await getPuiid(NAME, TAG);
  const summonerId = await getSummonerID(puuid);
  const todaysGames = await getGamesFromToday(NAME, TAG);
  console.log(todaysGames.length);
  //   console.log(rankData);
  //   const gameData = await getGameData("NA1_5104118758");
  //   console.log(Object.entries(gameData.info)[11][1][0].summonerId);
  //   console.log(
  //     await getPlayerDataFromGameData("jdawg", "1337", "NA1_5104135919")
  //   );
  //   console.log(await getGameResult(NAME, TAG, "NA1_5104135919"));
  //   console.log(await formatRankString(NAME, TAG));
}

main();
