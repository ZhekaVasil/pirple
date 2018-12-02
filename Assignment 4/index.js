const server = require('./lib/server');
const cli = require('./lib/cli');


// Main app container
const app = {};

app.init = () => {
  // Init server
  server.init();
  // Init cli
  setTimeout(() => cli.init(), 50);
};

// Let's get the party started
app.init();

module.exports = app;