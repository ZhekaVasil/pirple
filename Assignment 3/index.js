const server = require('./lib/server');

// Main app container
const app = {};

app.init = () => {
  // Init server
  server.init();
};

// Let's get the party started
app.init();

module.exports = app;