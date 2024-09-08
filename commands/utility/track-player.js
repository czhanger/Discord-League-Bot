const { SlashCommandBuilder } = require("discord.js");
const { gameTrackingBot, stopGameTrackingBot } = require("../../game-tracking");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("starttracking")
    .setDescription("Starts tracking player by name and tag")
    .addStringOption((option) =>
      option.setName("name").setDescription("League Name:").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("tag").setDescription("League Tag").setRequired(true)
    ),
  async execute(interaction) {
    const name = interaction.options.getString("name");
    const tag = interaction.options.getString("tag");

    try {
      const channel = interaction.channel;
      interaction.client.emit("startTracking", name, tag, channel.id);
      await interaction.reply(`Now Tracking: ${name} #${tag}`);
    } catch (error) {
      await interaction.reply(`Failed to track player: ${error}`);
    }
  },
};
