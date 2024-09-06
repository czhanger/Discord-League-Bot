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
  getTotalGameTime,
} = require("./Riot/riotFunctions");

const { getTodaysDate, calcLPChange } = require("./Riot/utilities");
async function main() {
  const rankData = await getRankFromNameTag(NAME, TAG);
  const puuid = await getPuiid(NAME, TAG);
  const summonerId = await getSummonerID(puuid);
  //   const todaysGames = await getGamesFromToday(NAME, TAG);
  //   console.log(todaysGames.length);
  //   const gameTime = await getTotalGameTime(todaysGames);
  //   console.log(await getTotalGameTime(todaysGames));
  //   console.log(rankData);
  //   const gameData = await getGameData("NA1_5104118758");
  //   console.log(Object.entries(gameData.info)[11][1][0].summonerId);
  //   console.log(
  //     await getPlayerDataFromGameData("jdawg", "1337", "NA1_5104135919")
  //   );
  //   console.log(await getGameResult(NAME, TAG, "NA1_5104135919"));
  //   console.log(await formatRankString(NAME, TAG));
  // New Rank Old Rank
  const LPChange = calcLPChange(50, 47, "W");
  console.log(LPChange);
}
main();
// const prompt = require("prompt-sync")();

// function testLP() {
//   var newLP = prompt("new:");
//   var currLP = prompt("old:");
//   var gameRes = prompt("result:");
//   console.log(calcLPChange(newLP, currLP, gameRes));
// }

// while (true) {
//   testLP();
// }
