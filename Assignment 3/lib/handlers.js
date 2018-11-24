/**
 * Module with route handlers
 */

const _data = require('./data');
const helpers = require('./helpers');
const stripe = require('./stripe');
const mailgun = require('./mailgun');

// Main handlers object to export
const handlers = {};

/**********************************************
 *
 * User Handlers
 *
 **********************************************/
handlers.users = (data, callback) => {
  if (['get', 'post', 'put', 'delete'].includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(400, {error: 'Method is not allowed'})
  }
};

// User API object
handlers._users = {};

// Create new user
handlers._users.post = ({payload: {name, email, address, password}}, callback) => {
  if (name && email && address && password) {
    _data.read('users', email, (err) => {
      if (err) {
        const hashPassword = helpers.hash(password);
        if (hashPassword) {
          _data.create('users', email, {name, email, address, hashPassword}, (err) => {
            if (!err) {
              callback(200, {message: 'User has been created'});
            } else {
              console.log(err);
              callback(500, {error: 'Could not create the new user'});
            }
          })
        } else {
          callback(500, {error: 'Could not hash user\'s password'});
        }
      } else {
        callback(400, {error: 'User already exists'});
      }
    })
  } else {
    callback(400, {error: 'Need to provide name, email, address, password'})
  }
};

// Get user profile
handlers._users.get = ({headers: {token = null}, queryStringObject: {email = null}}, callback) => {
  if (email) {
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            delete data.hashPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        })
      } else {
        callback(401, {error: 'Token is invalid'})
      }
    });
  } else {
    callback(400, {error: 'Missing email'})
  }
};

// Update user profile
handlers._users.put = ({ headers: {
                           token = null
                         },
                         payload: {
                           name = null,
                           email = null,
                           address = null,
                           password = null
                         }
                       }, callback) => {
  
  if (email) {
    if (name || address || password) {
      handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              if (name) {
                userData.name = name;
              }
              if (address) {
                userData.address = address;
              }
              if (password) {
                userData.hashPassword = helpers.hash(password);
              }
              _data.update('users', email, userData, (err) => {
                if (!err) {
                  callback(200, {message: 'User has been edited'})
                } else {
                  console.log(err);
                  callback(500, {error: 'Could not update the user'})
                }
              })
            } else {
              callback(404, {error: 'User not found'})
            }
          })
        } else {
          callback(401, {error: 'Token is invalid'})
        }
      });
    } else {
      callback(400, {error: 'Missing fields to update'})
    }
    
  } else {
    callback(400, {error: 'Missing required field'})
  }
};

// Delete user profile
handlers._users.delete = ({headers: {token = null}, queryStringObject: {email = null}}, callback) => {
  if (email) {
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', email, (err, data) => {
          if (!err && data) {
            _data.delete('users', email, (err) => {
              if (!err) {
                callback(200, {message: 'User has been removed'})
              } else {
                callback(500, {error: 'Can not delete the user'})
              }
            })
          } else {
            callback(404, {error: 'User not found'});
          }
        })
      } else {
        callback(401, {error: 'Token is invalid'})
      }
    });
  } else {
    callback(400, {Error: 'Missing email'})
  }
};

/**********************************************
 *
 * Token Handlers
 *
 **********************************************/
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback)
  } else {
    callback(405)
  }
};

// Tokens API object
handlers._tokens = {};

// Create new token
handlers._tokens.post = ({
                           payload: {
                             email = false,
                             password = false,
                           }
                         }, callback) => {
  
  if (email && password) {
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        const hashPassword = helpers.hash(password);
        if (hashPassword === userData.hashPassword) {
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            email,
            expires,
            id: tokenId
          };
          
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject)
            } else {
              callback(500, {error: 'Could not create new token'})
            }
          })
        } else {
          callback(400, {error: 'Password did not match'})
        }
      } else {
        callback(400, {error: 'User not found'})
      }
    })
  } else {
    callback(400, {error: 'Missing required fields'})
  }
};

// Get token data
handlers._tokens.get = ({queryStringObject: {id = false}}, callback) => {
  id = typeof id === 'string' && id.trim().length === 20 ? id.trim() : id;
  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    })
  } else {
    callback(400, {error: 'Missing required fields'})
  }
};

// Extend existent token
handlers._tokens.put = ({
                          payload: {
                            id = false,
                            extend = false
                          }
                        }, callback) => {
  id = typeof id === 'string' && id.trim().length === 20 ? id.trim() : id;
  extend = typeof extend === 'boolean' ? extend : false;
  
  if (id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200, {message: 'Token has been extended'});
            } else {
              callback(500, {error: 'Could not update token'})
            }
          })
        } else {
          callback(400, {error: 'Token already expired', expired: true})
        }
      } else {
        callback(400, {error: 'Token not found'})
      }
    })
  } else {
    callback(400, {error: 'Missing required fields or some fields are invalid'})
  }
  
  
};

// Delete a token
handlers._tokens.delete = ({queryStringObject: {id = false}}, callback) => {
  id = typeof id === 'string' && id.trim().length === 20 ? id.trim() : id;
  if (id) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200, {message: 'Token has been removed'});
          } else {
            callback(500, {Error: 'Can not delete the token'})
          }
        })
      } else {
        callback(404, {Error: 'Token not found'});
      }
    })
  } else {
    callback(400, {Error: 'Missing required fields'})
  }
};

// Verify token
handlers._tokens.verifyToken = (id, email, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.email === email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        console.log('Token has expired');
        callback(false);
      }
    } else {
      callback(false)
    }
  })
};

/**********************************************
 *
 * Menu Handlers
 *
 **********************************************/
handlers.menu = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    handlers._menu[data.method](data, callback)
  } else {
    callback(405)
  }
};

// Menu API object
handlers._menu = {};

// Get all menu
handlers._menu.get = ({headers: {token = null}, queryStringObject: {email = null}}, callback) => {
  if (email) {
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        handlers._getMenuItems((err, menu) => {
          if (!err && menu) {
            callback(200, menu);
          } else {
            callback(403, {error: err})
          }
        })
      } else {
        callback(401, {error: 'Token is invalid'})
      }
    });
  } else {
    callback(400, {error: 'Email is missing'})
  }
};

// Method to get all items in menu
handlers._getMenuItems = (callback) => {
  _data.list('menu', (err, list) => {
    if (!err && list && list.length) {
      const menu = {};
      let completed = 0;
      list.forEach((item, index, arr) => {
        _data.read('menu', item, (err, data) => {
          if (!err && data) {
            data.menu.forEach(menuItem => {
              menuItem.type = data.sectionName
            });
            menu[item] = data;
            if (++completed === arr.length) {
              callback(false, menu);
            }
          } else {
            callback(`Can not find ${item} in menu`)
          }
        })
      });
    } else {
      callback('Can not find menu items')
    }
  })
};

/**********************************************
 *
 * Cart Handlers
 *
 **********************************************/
handlers.cart = (data, callback) => {
  const acceptableMethods = ['post'];
  if (acceptableMethods.includes(data.method)) {
    handlers._cart[data.method](data, callback)
  } else {
    callback(405)
  }
};

// Cart API object
handlers._cart = {};

// Update user's cart
handlers._cart.post = ({headers: {token = null}, payload: {email = null, cart = null}}, callback) => {
  if (email && cart && cart.length) {
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        handlers._getMenuItems((err, menu) => {
          if (!err && menu) {
            
            const menuItems = [];
            const totalCart = [];
            let amount = 0;
            Object.keys(menu).forEach(item => {
              menuItems.push(...menu[item].menu)
            });
            
            cart.forEach(item => {
              const finding = menuItems.find(i => i.id === item);
              if (finding) {
                totalCart.push(finding);
                amount += finding.price;
              }
            });
            
            amount = Math.round(amount.toFixed(2)*100);
            
            stripe.pay({
              amount,
              description: 'Test Pizza Pay'
            }, (err, data) => {
              if (!err && data) {
                callback(200, data);
                mailgun.send({
                  email,
                  cart: totalCart,
                  price: amount
                })
              } else {
                callback(403, {error: err})
              }
            });
          } else {
            callback(403, {error: err})
          }
        });
      } else {
        callback(401, {error: 'Token is invalid'})
      }
    });
  } else {
    callback(400, {error: 'Need to provide email adn cart array'})
  }
};

// Ping the app
handlers.ping = (data, callback) => {
  callback(200, {ping: true})
};

// NotFound handler
handlers.notFound = (data, callback) => {
  callback(404)
};

/**
 *  Static routes
 *
 */

// Common method to serve static template
handlers.serveStaticPage = (name, data, templateData, callback) => {
  if (data.method === 'get') {
    helpers.getCommonTemplate(name, templateData, (err, str) => {
      if (!err && str) {
        callback(200, str, 'html')
      } else {
        callback(500, err, 'html')
      }
    })
  } else {
    callback(405, null, 'html')
  }
};

handlers.home = (data, callback) => {
  const templateData = {
    'head.title': 'Home',
    'head.description': 'Best pizza in the World',
    'body.class': 'index-page'
  };
  handlers.serveStaticPage('home', data, templateData, callback)
};

// Serve static files
handlers.public = (data, callback) => {
  if (data.method === 'get') {
    let trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
    if (trimmedAssetName) {
      helpers.getStaticAssets(trimmedAssetName, (err, data) => {
        if (!err && data) {
          let contentType = 'plain';
          if (trimmedAssetName.includes('.css')) {
            contentType = 'css'
          }
          if (trimmedAssetName.includes('.png')) {
            contentType = 'png'
          }
          if (trimmedAssetName.includes('.jpg')) {
            contentType = 'jpg'
          }
          if (trimmedAssetName.includes('.ico')) {
            contentType = 'favicon'
          }
          callback(200, data, contentType)
        } else {
          callback(404)
        }
      })
    } else {
      callback(404)
    }
  } else {
    callback(405, null, 'html')
  }
};

// Serve favicon
handlers.favicon = (data, callback) => {
  if (data.method === 'get') {
    helpers.getStaticAssets('img/favicon.ico', (err, data) => {
      if (!err && data) {
        callback(200, data, 'favicon')
      } else {
        callback(404)
      }
    })
  } else {
    callback(405, null, 'html')
  }
};

// Serve 404 page
handlers.notFoundStatic = (data, callback) => {
  const templateData = {
    'head.title': 'Page not found',
    'body.class': 'not-found-page'
  };
  handlers.serveStaticPage('404', data, templateData, callback)
};

// Serve SignUp page
handlers.signupPage = (data, callback) => {
  const templateData = {
    'head.title': 'Sign Up',
    'head.description': 'Add new pizza account',
    'body.class': 'sign-up-page'
  };
  handlers.serveStaticPage('signup', data, templateData, callback)
};

// Serve login page
handlers.loginPage = (data, callback) => {
  const templateData = {
    'head.title': 'Log In',
    'head.description': 'Log In to pizza account',
    'body.class': 'log-in-page'
  };
  handlers.serveStaticPage('login', data, templateData, callback)
};

// Serve menu page
handlers.menuPage = (data, callback) => {
  const templateData = {
    'head.title': 'Pizza Menu',
    'head.description': 'Order Pizza',
    'body.class': 'menu-page'
  };
  handlers.serveStaticPage('menu', data, templateData, callback)
};

// Serve cart page
handlers.cartPage = (data, callback) => {
  const templateData = {
    'head.title': 'Your cart',
    'head.description': 'Your cart',
    'body.class': 'cart-page'
  };
  handlers.serveStaticPage('cart', data, templateData, callback)
};



module.exports = handlers;