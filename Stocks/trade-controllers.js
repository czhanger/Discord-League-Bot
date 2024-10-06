const { Users } = require("../Models/Users");
const { Trades } = require("../Models/Trades");
const { getPuiid, getRankData } = require("../Riot/riotFunctions");
const {
  addCurrency,
  showBalance,
  canAfford,
  removeCurrency,
} = require("./user-controllers");

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

    // make sure duplicate trade doesn't already exist
    if (await module.exports.existingTrade(userId, puuid)) {
      return false;
    }

    // check if user can afford trade
    if (!(await canAfford(userId))) {
      return {
        message: "Insufficient Balance",
        tradeStatus: false,
      };
    } else {
        // attempt to remove currency from user's balance
      if (!(await removeCurrency(userId, purchase_price))) {
        return {
          message: "Error removing funds from balance, trade aborted",
          tradeStatus: false,
        };
      }
    }

    // only create trade once funds are removed from user's balance
    const newBalance = await showBalance(userId);

    const newTrade = await Trades.create({
      user_id: userId,
      player_puuid: puuid,
      player_rank: rank,
      purchase_price: purchase_price,
    });

    return {
      message: "Trade created",
      tradeStatus: true,
      trade: newTrade,
      newBalance: newBalance,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Error creating new trade",
      tradeStatus: false,
    };
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
    if (!trade) {
      return { message: "No active trade found", success: false };
    }

    const priceChange = puuid - trade.purchase_price;
    const currentPrice = puuid;
    await addCurrency(userId, currentPrice);
    const newBalance = await showBalance(userId);

    await trade.destroy();

    return {
      message: "Trade successfully closed",
      priceChange: priceChange,
      newBalance: newBalance,
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An error occurred while closing the trade",
      success: false,
    };
  }
};
