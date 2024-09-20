const { SlashCommandBuilder } = require("discord.js");
const { getRankFromNameTag } = require("../../Riot/riotFunctions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank-check")
    .setDescription("Returns current rank of a given player")
    .addStringOption((option) =>
      option.setName("name").setDescription("League Name:").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("tag").setDescription("League Tag").setRequired(true)
    )
    .addStringOption((option) => 
      option.setName("ranked-mode")
        .setDescription("Current rank from which game mode?")
        .setRequired(true)
        .addChoices(
          {name:'Solo/Duo', value: 'RANKED_SOLO_5x5'},
          {name: 'Flex', value: 'RANKED_FLEX_SR'},
        )
    ),
  async execute(interaction) {
    const name = interaction.options.getString("name");
    const tag = interaction.options.getString("tag");
    const queue = interaction.options.getString("ranked-mode");
    
    const rankData = await getRankFromNameTag(name, tag, queue);
    let replyStr

    if (!rankData) {
      replyStr = `${name} is currently unranked in ${queue}`
    } else {
      replyStr = `${name} is currently ${rankData.tier} ${rankData.rank}: ${rankData.leaguePoints} LP. ${name}ing it!`
    }
    await interaction.reply(
      replyStr
    );
  },
};
