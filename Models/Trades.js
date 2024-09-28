module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "trades",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: DataTypes.STRING,
      purchase_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      player_puuid: DataTypes.STRING,
      player_rank: DataTypes.INTEGER,
    },
    {
      timestamps: false,
    }
  );
};
