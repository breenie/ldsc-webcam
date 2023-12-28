const slsw = require("serverless-webpack");

module.exports = {
  // output: set by the plugin
  mode: "production",
  target: "node",
  entry: slsw.lib.entries
};
