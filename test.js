const dotenv = require("dotenv");
dotenv.config();

const { getRankFromNameTag, getPuiid } = require("./Riot/riotFunctions");

async function main() {
  const rankData = await getRankFromNameTag("jdawg", "1337");
  console.log(rankData);
}

main();
