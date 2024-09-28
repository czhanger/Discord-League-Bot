const { Users } = require("../Models/Users");
const { Trades } = require("../Models/Trades");

// userId is interaction.user.username from discord

module.exports.createUser = async function (userId) {
  try {
    const newUser = await Users.create({
      user_id: userId,
      balance: 1000,
    });
    return newUser;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports.showBalance = async function (userId) {
  let user = await Users.findOne({ where: { user_id: userId } });
  if (user === null) {
    user = module.exports.createUser(userId);
  }
  return user.balance;
};

// add currency to given user, returns true if successful, false if not
module.exports.addCurrency = async function (userId, amount) {
  try {
    let user = await Users.findOne({ where: { user_id: userId } });
    if (user === null) {
      user = module.exports.createUser(userId);
    }
    user.balance += amount;
    await user.save();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.removeCurrency = async function (userId, amount) {
  try {
    let user = await Users.findOne({ where: { user_id: userId } });
    if (user === null) {
      user = module.exports.createUser(userId);
    }
    user.balance -= amount;
    // no negative balance
    if (user.balance < 0) {
      user.balance = 0;
    }
    await user.save();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// check if user can afford to spend a given amount from their balance
module.exports.canAfford = async function (userId, amount) {
  try {
    let user = await Users.findOne({ where: { user_id: userId } });
    if (user === null) {
      user = module.exports.createUser(userId);
    }
    if (amount > user.balance) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
