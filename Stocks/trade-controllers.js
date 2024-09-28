const { Users } = require("../Models/Users");
const { Trades } = require("../Models/Trades");

module.exports.addUser = async function (userId) {
    try {
      const newUser = await Users.create({
        user_id: userId,
        balance: 1000,
      });
      return newUser;
    } catch (error) {
      console.error(error);
    }
  };