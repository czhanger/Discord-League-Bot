const { SlashCommandBuilder } = require("discord.js");
const { getRankFromNameTag } = require("../../Riot/riotFunctions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rankcheck")
    .setDescription("Replies with current rank"),
  async execute(interaction) {
    const rankData = await getRankFromNameTag("Jdawg", "1337");
    await interaction.reply(
      `Jdawg is currently ${rankData.tier} ${rankData.rank}: ${rankData.leaguePoints} LP. Jdawgin it!`
    );
  },
};
