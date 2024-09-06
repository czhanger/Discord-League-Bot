module.exports.unixToDate = async function (unixTime) {
  const date = new Date(unixTime); // Convert Unix time in milliseconds to a Date object

  // Options for Pacific Standard Time formatting
  const options = {
    timeZone: "America/Los_Angeles", // PST/PDT Time Zone
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    // minute: "numeric",
    // second: "numeric",
    hour12: true, // 12-hour format
  };

  // Format date to PST with the specified options
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

// get todays date
// 24 hour period starting from 6am
module.exports.getTodaysDate = function () {
  const date = new Date(); // Create a new Date object with the current date and time

  // Check if the time is before 6 AM
  if (date.getHours() < 6) {
    date.setDate(date.getDate() - 1); // Subtract one day if before 6 AM
  }

  // Format options for "Month Day, Year, Hour:Minute:Second"
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: true, // 12-hour format
  };

  // Format date to "Month Day, Year, Hour:Minute:Second AM/PM" using the 'en-US' locale
  return date.toLocaleString("en-US", options);
};

module.exports.secondsToHours = function (seconds) {
  const hours = Math.floor(seconds / 3600); // Calculate the whole hours
  const minutes = Math.floor((seconds % 3600) / 60); // Calculate remaining minutes
  const remainingSeconds = seconds % 60; // Calculate remaining seconds

  return `${hours} hours, ${minutes} minutes, and ${remainingSeconds} seconds`;
};

module.exports.adjustDateIfBefore6AM = function (dateString) {
  // Extract date and time parts from the input string
  const [datePart, timePart] = dateString.split(" at ");
  const [month, day, year] = datePart.split(" ");

  // Extract time and period (AM/PM)
  const [time, period] = timePart.split(" ");
  const [hours, minutes = 0] = time.split(":").map(Number);

  // Convert 12-hour format to 24-hour format
  let adjustedHours = hours % 12; // Convert 12 AM or PM to 0 or 12, respectively
  if (period.toUpperCase() === "PM") {
    adjustedHours += 12; // Add 12 hours for PM times
  }

  // Create a new Date object
  const parsedDate = new Date(`${month} ${day}, ${year}`);
  parsedDate.setHours(adjustedHours, minutes, 0, 0); // Set the hours and minutes

  // Check if the parsed time is before 6 AM
  if (parsedDate.getHours() < 6) {
    parsedDate.setDate(parsedDate.getDate() - 1); // Subtract one day if before 6 AM
  }

  // Format options for "Month Day, Year"
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Format date to "Month Day, Year" using the 'en-US' locale
  return parsedDate.toLocaleDateString("en-US", options);
};

module.exports.calcLPChange = function (newRank, oldRank, gameResult) {
  let LPChange = 0;
  newRank = Number(newRank);
  oldRank = Number(oldRank);
  // If win and new rank is lower than old (increased division)
  if (gameResult === "W" && newRank < oldRank) {
    LPChange = 100 - oldRank + newRank;
    console.log("rank increase");
    // If loss and new rank is higher than old (decreased division)
  } else if (gameResult === "L" && newRank > oldRank) {
    console.log("rank decrease");
    LPChange = -(oldRank + (100 - newRank));
  } else {
    LPChange = newRank - oldRank;
    console.log("same rank");
  }
  return LPChange;
};

module.exports.createLPStr = function (LP) {
  if (LP > 0) {
    return "+" + LP;
  } else {
    return LP;
  }
};
