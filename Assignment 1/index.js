const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const cluster = require('cluster');
const os = require('os');

class App {
  /**
   * Init App
   * @memberOf App
   */
  static init() {
    if (cluster.isMaster) {
      console.log(`Master ${process.pid} is running`);
      // If it is master - create forks
      os.cpus().forEach((cpu, index) => {
        console.log(`Forking process number ${index}...`);
        cluster.fork();
      });
    } else {
      console.log(`Worker ${process.pid} started...`);
      // If it is fork - Start the server
      App.startServer();
    }
  }
  
  /**
   * Start server method
   * @memberOf App
   */
  static startServer() {
    // Create HTTP server
    const httpServer = http.createServer((req, res) => {
      App.unifiedServer(req, res);
    });

    // Start listening httpPort
    httpServer.listen(config.httpPort, () => {
      console.log(`The http server is listening on port ${config.httpPort}`);
    });
  }
  
  /**
   * Unified Server factory
   * @memberOf App
   */
  static unifiedServer(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    
    const decoder = new StringDecoder('utf-8');
    
    // Input buffer
    let buffer = '';
    
    // Listener for 'data' event
    req.on('data', (data) => {
      buffer += decoder.write(data);
    });
    
    // Listener for 'end' event
    req.on('end', () => {
      buffer += decoder.end();
      
      const chosenHandler = typeof (App.router[trimmedPath]) !== 'undefined' ? App.router[trimmedPath] : App.handlers.notFound;
      
      // Create request object with payload if exists
      const data = {
        payload: buffer
      };
      
      // Call route handler
      chosenHandler(data, (statusCode, payload) => {
        statusCode = typeof statusCode === 'number' ? statusCode : 200;
        payload = typeof payload === 'object' ? payload : {};
        
        const payloadString = JSON.stringify(payload);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log('Response was sent.')
      });
    });
  }
  
  /**
   * Route handlers
   *
   * @memberOf App
   * @return {Object} Object with available handlers
   */
  static get handlers() {
    return {
      // Handler for 'hello' route
      hello: (data, callback) => {
        const message = {
          message: data.payload ? `Your message was ${data.payload}` : 'There is no message'
        };
        callback(200, message)
      },
  
      // Handler for 404 route
      notFound: (data, callback) => {
        callback(404)
      }
    }
  }
  
  /**
   * App Router
   *
   * @memberOf App
   * @return {Object} Object with APP Routes
   */
  static get router() {
    return {
      'hello': App.handlers.hello
    }
  }
}
// Let's get the party started
App.init();
