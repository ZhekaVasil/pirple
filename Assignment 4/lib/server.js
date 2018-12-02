/**
 * Server module
 */

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// Main container
const server = {};

// HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

// Common server
server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
  const queryStringObject = parsedUrl.query;
  
  const method = req.method.toLowerCase();
  
  const headers = req.headers;
  
  const decoder = new StringDecoder('utf-8');
  
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();
    let chosenHandler;
    const notFoundHandler = trimmedPath.includes('api/') ? handlers.notFound : handlers.notFoundStatic;
  
    if (trimmedPath.includes('public/')) {
      chosenHandler = server.router.public
    } else {
      chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : notFoundHandler
    }
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };
    
    chosenHandler(data, (statusCode, payload, type = 'json') => {
      statusCode = typeof statusCode === 'number' ? statusCode : 200;
      
      const payloadString = server.getPayloadString(type, payload);
      res.setHeader('Content-Type', server.getContentType(type));
      res.writeHead(statusCode);
      res.end(payloadString);
      
      if (statusCode === 200) {
        console.log('\x1b[32m%s\x1b[0m', `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
      } else {
        console.log('\x1b[31m%s\x1b[0m', `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
      }
      
    });
  });
};

// Get valid payload string
server.getPayloadString = (type, payload) => {
  if (type === 'json') {
    return JSON.stringify(payload)
  } else if (type === 'html') {
    return typeof payload === 'string' ? payload : ''
  } else {
    return typeof payload !== 'undefined' ? payload : ''
  }
};

// Get valid content type
server.getContentType = (type) => {
  const map = {
    json: 'application/json',
    html: 'text/html',
    favicon: 'image/x-icon',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpeg',
    plain: 'text/plain'
  };
  
  return map[type]
};

// Available routes
server.router = {
  '': handlers.home,
  'favicon.ico': handlers.favicon,
  'public': handlers.public,
  'ping': handlers.ping,
  
  'signup': handlers.signupPage,
  'login': handlers.loginPage,
  'menu': handlers.menuPage,
  'cart': handlers.cartPage,
  
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/menu': handlers.menu,
  'api/cart': handlers.cart
};

// Init server method
server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', `The http server is listening on port ${config.httpPort}`);
  });
};

module.exports = server;