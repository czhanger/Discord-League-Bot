const { SlashCommandBuilder } = require("discord.js");
const { checkBotInstances } = require("../../game-tracking");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start-tracking")
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
    // first check if instanceId (name + tag) is already being tracked
    if (!checkBotInstances(name + tag)) {
      try {
        const channel = interaction.channel;
        interaction.client.emit("startTracking", name, tag, channel.id);
        await interaction.reply(`Now Tracking: ${name} #${tag}`);
      } catch (error) {
        await interaction.reply(`Failed to track player: ${error}`);
      }
    } else {
      await interaction.reply(`${name} is already being tracked`);
    }
  },
};
