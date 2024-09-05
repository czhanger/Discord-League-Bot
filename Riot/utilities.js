module.exports.unixToDate = async function (unixTime) {
  const date = new Date(unixTime); // Convert Unix time in milliseconds to a Date object

  // Options for Pacific Standard Time formatting
  const options = {
    timeZone: "America/Los_Angeles", // PST/PDT Time Zone
    year: "numeric",
    month: "long",
    day: "numeric",
    // hour: "numeric",
    // minute: "numeric",
    // second: "numeric",
    hour12: true, // 12-hour format
  };

  // Format date to PST with the specified options
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

module.exports.getTodaysDate = function () {
  const date = new Date(); // Create a new Date object with the current date and time

  // Format options for "Month Day, Year"
  const options = { year: "numeric", month: "long", day: "numeric" };

  // Format date to "Month Day, Year" using the 'en-US' locale
  return date.toLocaleDateString("en-US", options);
};

module.exports.totalPlayTime = function (matchList) {
  var totalTime = 0;
  for (const match in matchList) {
    //add up total time
  }
};
