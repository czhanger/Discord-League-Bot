module.exports.delay = function (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
