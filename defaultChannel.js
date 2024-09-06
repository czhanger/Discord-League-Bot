// Function to get the first available text channel the bot can access

function getDefaultTextChannel(guild) {
  return guild.channels.cache
    .filter(
      (channel) =>
        channel.isTextBased() &&
        channel.permissionsFor(guild.members.me).has("SendMessages")
    )
    .first();
}

// Function to send a message to the default channel in a specific guild
function sendMessageToDefaultChannel(guild, message) {
  const channel = getDefaultTextChannel(guild);
  if (channel) {
    channel.send(message);
  } else {
    console.error("No accessible text channel found in this server.");
  }
}

module.exports.sendMessageToAll = function (message, client) {
  client.guilds.cache.forEach((guild) => {
    sendMessageToDefaultChannel(guild, message);
  });
};

module.exports.sendMessageToChannel = function (message, client, channelId) {
  client.on("ready", () => {
    const channel = client.channels.cache.get(channelId);
    channel.send(message);
  });
};
