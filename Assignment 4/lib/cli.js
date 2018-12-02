const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
const _data = require('./data');
class _events extends events{};
const handlers = require('./handlers');
const _logs = require('./logs');

class CLI {
  // Constructur
  constructor() {
    this._interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });
    
    this.e = new _events();
  }
  
  // Initialize method
  init() {
    console.log('\x1b[34m%s\x1b[0m', 'CLI is running');
    
    // Apply event listeners
    this.applyEventListeners();
    
    // Show prompt
    this._interface.prompt();
  
    this._interface.on('line', (str) => {
      this.processInput(str);

      // Show prompt
      this._interface.prompt();
    });
  
    this._interface.on('close', () => {
      process.exit(0);
    });
  }
  
  // Apply event listeners method
  applyEventListeners() {
    const mapping = {
      'man': 'help',
      'help': 'help',
      'exit': 'exit',
      'menu': 'menu',
      'list users': 'listUsers',
      'user': 'user',
      'recent orders': 'recentOrders',
      'order': 'order',
      'list logs': 'listLogs',
      'log': 'log',
      'recent signups': 'recentSignUps'
    };
    
    Object.keys(mapping).forEach(eventName => {
      this.e.on(eventName, (input, str) => this.responders[mapping[eventName]](input, str));
    });
  }
  
  // Event handlers
  get responders() {
    const responders = {};
  
    // Help responder
    responders.help = () => {
      const commands = {
        'exit': 'Kill the CLI and the rest of the app',
        'man': 'Show this help page',
        'help': 'Alias of the "man" command',
        'menu': 'Show all menu items',
        'list users': 'Show a list of all users',
        'user --{userEmail}': 'Show details of a user based on email',
        'list logs': 'Show all logs',
        'log --{logPath}': 'Show specific log based on path',
        'recent orders': 'Show all the recent orders in the system (orders placed in the last 24 hours)',
        'order --{orderId}': 'Show the details of a specific order by order ID',
        'recent signups': 'Show all the users who have signed up in the last 24 hours'
      };
    
      this.horizontalLine();
      this.centered('CLI MANUAL');
      this.horizontalLine();
      this.verticalSpace(2);
    
      for(let key in commands) {
        const value = commands[key];
        let line = `\x1b[34m${key}\x1b[0m`;
        let padding = 60 - line.length;
      
        for (let i = 0; i< padding; i++) {
          line += ' ';
        }
      
        line += value;
        console.log(line);
        this.verticalSpace();
      
      }
      this.verticalSpace(1);
      this.horizontalLine();
    };
  
  
    // Exit responder
    responders.exit = () => {
      process.exit(0);
    };
    
    // Show all menu items
    responders.menu = () => {
      handlers._getMenuItems((err, menu) => {
        if (!err && menu) {
          Object.keys(menu).forEach(key => {
            menu[key].menu.forEach(item => {
              this.verticalSpace();
              console.log(`Type: ${item.type}; Name: ${item.name}; Price: ${item.price}$;`);
              this.verticalSpace();
            })
          });
        }
      })
    };
  
    // Show all users
    responders.listUsers = () => {
      _data.list('users', (err, userIds) => {
        if (!err && userIds && userIds.length) {
          this.verticalSpace();
          userIds.forEach(userId => {
            _data.read('users', userId, (err, userData) => {
              if (!err && userData) {
                let line = `Name: ${userData.name}; Email: ${userData.email}; Address: ${userData.address};`;
                console.log(line);
                this.verticalSpace();
              }
            })
          })
        }
      })
    };
    
    // Show specific user
    responders.user = (str) => {
      const arr = str.split('--');
      const userId = arr[1] && arr[1].trim().length ? arr[1].trim() : '';
      if (userId) {
        _data.read('users', userId, (err, userData) => {
          if (!err && userData) {
            delete userData.hashPassword;
            this.verticalSpace();
            console.dir(userData, {'colors': true});
            this.verticalSpace();
          } else {
            console.log(`User ${userId} not found`)
          }
        })
      }
    };
  
    // Show all logs
    responders.listLogs = () => {
      ['orders', 'signup'].forEach(type => {
        _logs.list(type, true, (err, logFileNames) => {
          if (!err && logFileNames && logFileNames.length) {
            this.verticalSpace();
            logFileNames.forEach(logFileName => {
              console.log(logFileName);
            });
            this.verticalSpace();
          }
        })
      })
    };
    
    // Show recent orders
    responders.recentOrders = () => {
      
      _logs.getRecentOrders((err, orders) => {
        if (!err && orders && orders.length) {
          this.verticalSpace();
          orders.forEach(order => {
            // Remove unnecessary data
            delete order.data;
            console.dir(order, {colors: true})
          });
          this.verticalSpace();
        }
      });
    };
  
    // Show recent Signups
    responders.recentSignUps = () => {
      _logs.getRecentSignUps((err, data) => {
        if (!err && data && data.length) {
          this.verticalSpace();
          data.forEach(signup => {
            console.dir(signup, {colors: true})
          });
          this.verticalSpace();
        }
      });
    };
  
    // Show specific order
    responders.order = (str) => {
      const arr = str.split('--');
      const orderId = arr[1] && arr[1].trim().length ? arr[1].trim() : '';
      if (orderId) {
        _logs.getOrderData(orderId, (err, data) => {
          if (!err && data) {
            this.verticalSpace();
            console.dir(data, {colors: true});
            this.verticalSpace();
          }
        })
      }
    };
  
    // Show specific log
    responders.log = (str) => {
      const arr = str.split('--');
      const logPath = arr[1] && arr[1].trim().length ? arr[1].trim() : '';
      if (logPath) {
        _logs.getLogData(logPath, (err, data) => {
          if (!err && data) {
            this.verticalSpace();
            console.dir(data, {colors: true});
            this.verticalSpace();
          }
        })
      }
    };
    
    return responders;
  }
  
  // Draw vertical line
  verticalSpace(lines = 1) {
    for (let i = 0; i < lines; i++) {
      console.log('')
    }
  };
  
  // Draw horizontal line
  horizontalLine() {
    let width = process.stdout.columns;
    let line = '';
    for(let i=0; i<width; i++) {
      line += '-';
    }
    console.log(line);
  };
  
  // Show centered text
  centered(str = '') {
    let width = process.stdout.columns;
    let leftPadding = Math.floor((width - str.length) / 2);
    let line = '';
    for(let i=0; i<leftPadding; i++) {
      line += ' ';
    }
    console.log(line + str);
  };
  
  // Process user's input
  processInput(str) {
    str = typeof str === 'string' && str.trim().length ? str.trim() : '';
    if (str) {
      const uniqueInputs = [
        'man',
        'help',
        'exit',
        'menu',
        'list users',
        'user',
        'list logs',
        'log',
        'recent orders',
        'order',
        'recent signups'
      ];
      
      let matchFound = false;
      
      uniqueInputs.some(input => {
        if (str.toLowerCase().includes(input)) {
          matchFound = true;
          this.e.emit(input, str);
          return true;
        }
      });
      
      if (!matchFound) {
        console.log('Sorry, command not found, use help for showing all possible commands');
      }
      
    }
  };
}

module.exports = new CLI();