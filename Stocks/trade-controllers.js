const { Users } = require("../Models/Users");
const { Trades } = require("../Models/Trades");
const { getPuiid, getRankData } = require("../Riot/riotFunctions");
const { addCurrency } = require("./user-controllers");

module.exports.createTrade = async function (
  userId,
  playerName,
  playerTag,
  queueType
) {
  try {
    const puuid = await getPuiid(playerName, playerTag);
    const rank = await getRankData(puuid, queueType);
    const purchase_price = rank;

    if (module.exports.existingTrade(userId, puuid)) {
      return false;
    }
    const newTrade = await Trades.create({
      user_id: userId,
      player_puuid: puuid,
      player_rank: rank,
      purchase_price: purchase_price,
    });
    return newTrade;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// check if user already has a trade on the given player
module.exports.existingTrade = async function (userId, puuid) {
  try {
    const existingTrade = await Trades.findOne({
      where: {
        user_id: userId,
        player_puuid: puuid,
      },
    });

    if (existingTrade) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports.closeTrade = async function (userId, puuid) {
  try {
    const trade = await Trades.findOne({
      where: {
        user_id: userId,
        player_puuid: puuid,
      },
    });
    // on close, display price change, and show new balance of user
  } catch (error) {
    console.error(error);
    return null;
  }
};
