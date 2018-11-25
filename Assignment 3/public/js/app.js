/**
 * Client application
 */

// Main app container
const app = {};
// Config container
app.config = {};
// User's token
app.token = {};
// Container for messages
app.messages = {};
// Callbacks container
app.callbacks = {};
// User's authorization
app.isUserAuthorized = false;
// User's cart
app.cart = {};
// Container for all menu items
app.allItems = {};
// Instance of Stripe
app.stripeHandler = null;

// Pages for which authorization is nit required
app.config.safePage = ['', 'login', 'signup'];

// Token for using payment form
app.config.stripeToken = 'pk_test_U73Ltl4YduFAcGTFISR2in7T';
app.config.stripeImage = 'public/img/logo.png';

app.config.siteName = 'Easy Pizza';

app.messages.emptyCart = 'Your cart is empty.';
app.messages.serviceError = 'Something is wrong, please try later.';
app.messages.completAllFields = 'Please complete all fields.';
app.messages.canNotProcessOrder = 'Can not process the order.';

app.isSafePage = (page) => app.config.safePage.includes(page);

// Method to perform AJAX requests
app.request = (url, {body = {}, ...options} = {}) => {
  options = {...{
      method: options.method || 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        token: app.token.id || 'Anonymous'
      },
      body: JSON.stringify(body)
  }, ...options};
  
  if (options.method === 'GET') {
    delete options.body
  }
  
  return fetch(url, options)
  .then(app.handleResponseStatus)
  .then(response => response.json())
};

// Handle response status from fetch request
app.handleResponseStatus = (response) => {
  return new Promise((resolve, reject) => {
    if (!response.ok) {
      response.json().then(message => {
        reject(message);
      });
    } else {
      resolve(response)
    }
  });
};


// Apply form handlers
app.applyFormHandlers = () => {
  const form = document.querySelector('form.user-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const
        fields = form.querySelectorAll('input[name]'),
        callBackAttr = form.getAttribute('data-callback'),
        body = {};
    
      let isFormError = false;
    
      // Hide error message
      app.hideFormErrorMessage(form);
    
      for (let field of fields) {
        if (field.value) {
          body[field.name] = field.value.trim();
        } else {
          isFormError = true;
          break;
        }
      }
    
      if (isFormError) {
        // Show error message
        app.showFormErrorMessage(form, app.messages.completAllFields);
      } else {
        // Send form
        app.sendForm(form, body, app.callbacks[callBackAttr].bind(this, form, body))
      }
    });
  }
};

// Perform form sending
app.sendForm = (form, body, callback) => {
  // Disabled all fields
  app.disableFormElements(form, true);
  app.request(form.action, {
    method: form.method,
    body
  })
  .then(response => {
    callback(response)
  }, (errorResponse) => {
    app.showFormErrorMessage(form, errorResponse.error);
    app.disableFormElements(form, false)
  });
};

// Disable form elements
app.disableFormElements = (form, disable) => {
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach(fieldset => {
    if (disable) {
      fieldset.setAttribute('disabled', disable);
    } else {
      fieldset.removeAttribute('disabled');
    }
  });
};

// Show form error message
app.showFormErrorMessage = (form, message = app.messages.serviceError) => {
  const errorField = form.querySelector('.form-error');
  errorField.classList.remove('hidden');
  errorField.innerText = message
};

// Hide form error message
app.hideFormErrorMessage = (form) => {
  const errorField = form.querySelector('.form-error');
  errorField.classList.add('hidden');
};

// Callback after successful Sign Up
app.callbacks.successSignUp = (form, formBody, response) => {
  app.request('api/tokens', {
    method: 'POST',
    body: {
      email: formBody.email,
      password: formBody.password
    }
  }).then(response => {
    window.localStorage.token = JSON.stringify(response);
    window.location = form.getAttribute('data-redirect');
  }, errorResponse => {
    app.showFormErrorMessage(form, errorResponse.error);
    app.disableFormElements(form, false);
  })
};

// Callback after successful Log In
app.callbacks.successLogIn = (form, body, response) => {
  window.localStorage.token = JSON.stringify(response);
  window.location = form.getAttribute('data-redirect');
};

// Log some service errors
app.callbacks.logServiceError = (response) => {
  console.error(response.error);
  return response;
};

// Show components base on user's authorization
app.callbacks.processDomComponents = () => {
  const components = app.isUserAuthorized ? '.unauthorized' : '.authorized';
  
  Array.from(document.querySelectorAll(components)).forEach(component => {
    component.remove();
  })
};

// Apply handler for logOut button
app.applyLogOutHandler = () => {
  const button = document.querySelector('#log_out');
  if (button) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      app.request(`api/tokens?id=${app.token.id}`, {
        method: 'DELETE'
      }).then(() => {
        window.localStorage.token = "{}";
        app.goToPage('/')
      }, () => {
        alert('Can not logout.')
      })
    })
  }
};

// Find token in localStorage and apply it
app.applyToken = () => {
  if (window.localStorage.token) {
    try {
      app.token = JSON.parse(window.localStorage.token);
    } catch (error) {
      app.token = null;
    }
  }
};

// Verify user's token request
app.verifyToken = () => {
  return app.request('api/tokens', {
    method: 'PUT',
    body: {
      id: app.token.id,
      extend: true
    }
  })
};

// Method for routing
app.goToPage = (page) => {
  const currentPage = window.location.pathname.substring(1);
  if (currentPage !== `${page}`) {
    window.location = page || '/'
  }
};

// Check user's authorization
app.checkAuthorization = () => {
  const currentPage = window.location.pathname.substring(1);
  app.applyToken();
  return new Promise((resolve, reject) => {
    if (app.token && app.token.id) {
      app.verifyToken()
      .then(() => {
        app.isUserAuthorized = true;
        resolve();
      }, (error) => {
        if (error.expired) {
          if (!currentPage) {
            // Go to login page if token has expired
            app.goToPage('login')
          }
        } else {
          if (!app.isSafePage(currentPage)) {
            // Go to home page
            app.goToPage('');
          }
        }
        reject(error);
      })
    } else {
      if (!app.isSafePage(currentPage)) {
        // Go to home page
        app.goToPage('');
      }
      reject({error: 'User is not authenticated'});
    }
  });
};

// Show menu items
app.showMenuList = () => {
  const container = document.querySelector('#menu_items');
  return app.request(`api/menu?email=${app.token.email}`)
  .then(response => {
    let html = '';
    html += `<table>`;
    Object.keys(response).forEach(key => {
      html += `<tr><td colspan="4"><h2 class="menu-title m-b-1">${response[key].sectionName}</h2></td></tr>`;
      response[key].menu.forEach(item => {
        html += `<tr class="menu-item">`;
        html += `<td><figure><img class="menu-item-image" src="${item.image}"></figure></td>`;
        html += `<td><div class="menu-item-name">${item.name}</div></td>`;
        html += `<td><div class="menu-item-price">${item.price}$</div></td>`;
        html += `<td class="menu-item-button">`;
        html += `<button class="btn menu-item-btn" id="${item.id}">Add to cart</button>`;
        html += `</td>`;
        html += `</tr>`;
      });
    });
    html += `</table>`;
    
    container.innerHTML = html;
  
    container.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('menu-item-btn')) {
        app.addToCart(target.id)
      }
    })
  }, (errorResponse) => {
    container.innerHTML = errorResponse.error || app.messages.serviceError;
  })
};


// Show menu items
app.showCartList = () => {
  const container = document.querySelector('#cart_items');
  if (Object.keys(app.cart).length) {
    return app.request(`api/menu?email=${app.token.email}`)
    .then(response => {
      const allItems = {};
      Object.keys(response).forEach(key => {
        response[key].menu.forEach(item => {
          allItems[item.id] = item
        })
      });
      app.allItems = allItems;
      let html = '';
      html += `<table>`;
      Object.keys(app.cart).forEach(key => {
        if (key in allItems) {
          html += `<tr class="menu-item" id="${key}">`;
          html += `<td><figure><img class="menu-item-image" src="${allItems[key].image}"></figure></td>`;
          html += `<td><div class="menu-item-name">${allItems[key].name}</div></td>`;
          html += `<td><div class="cart-item-price" data-id="${key}">${app.getItemTotalAmount(key)}$</div></td>`;
          html += `<td class="menu-item-button">`;
          html += `<button class="btn small cart-item-action m-r-1" data-action="add" data-id="${key}">+</button>`;
          html += `<span class="cart-item-count" data-id="${key}">${app.cart[key]}</span>`;
          html += `<button class="btn small cart-item-action m-l-1" data-action="remove" data-id="${key}">-</button>`;
          html += `</td>`;
          html += `</tr>`;
        }
      });
      html += `</table>`;
      html += `<button class="btn cart-item-order"></button>`;
    
      container.innerHTML = html;
      
      // Show total amount
      app.showTotalAmount();
      
      // Initialize payment form
      app.stripeInitialize();
    
      container.addEventListener('click', app.callbacks.handleCartActions.bind(this, container))
    }, (errorResponse) => {
      container.innerHTML = errorResponse.error || app.messages.serviceError;
    })
  } else {
    container.innerHTML = app.messages.emptyCart;
  }
};

// Initialize payment form
app.stripeInitialize = () => {
  app.stripeHandler = StripeCheckout.configure({
    key: app.config.stripeToken,
    image: app.config.stripeImage,
    locale: 'auto',
    email: app.token.email,
    token: (token) => {
      const button = document.querySelector('.cart-item-order');
      // Disable submit button
      button.setAttribute('disabled', 'true');
      app.request('api/cart', {
        method: 'POST',
        body: {
          email: app.token.email,
          cart: app.createCart(),
          source: token.id
        }
      }).then(() => {
        window.localStorage.removeItem('cart');
        app.goToPage('');
      }, () => {
        // Enable submit button
        button.removeAttribute('disabled');
        alert(app.messages.canNotProcessOrder)
      })
    }
  });
};

// Handle cart actions
app.callbacks.handleCartActions = (container, event) => {
  event.preventDefault();
  const target = event.target;
  if (target.classList.contains('cart-item-action')) {
    
    const
      action = target.getAttribute('data-action'),
      id = target.getAttribute('data-id');
    
    if (action === 'add') {
      app.addToCart(id)
    } else {
      app.removeFromCart(id)
    }
    
    if (id in app.cart) {
      document.querySelector(`.cart-item-count[data-id=${id}]`).innerHTML = app.cart[id];
      document.querySelector(`.cart-item-price[data-id=${id}]`).innerHTML = `${app.getItemTotalAmount(id)}$`;
    } else {
      document.querySelector(`#${id}`).remove();
    }
    
    if (!Object.keys(app.cart).length) {
      container.innerHTML = app.messages.emptyCart;
    } else {
      app.showTotalAmount()
    }
    
  } else if (target.classList.contains('cart-item-order')) {
    app.makeOrder()
  }
};

// Make order request
app.makeOrder = () => {
// Open Checkout with further options:
  app.stripeHandler.open({
    name: app.config.siteName,
    amount: app.getTotalAmount() * 100
  });
};

// Create new cart for service request
app.createCart = () => {
  const cart = [];
  Object.keys(app.cart).forEach(id => {
    for (let i = 1; i <= app.cart[id]; i++) {
      cart.push(id);
    }
  });
  return cart;
};

// Show total amount cart button
app.showTotalAmount = () => {
  const element = document.querySelector('.cart-item-order');
  if (element) {
    element.innerHTML = `Order (${app.getTotalAmount()}$)`
  }
};

// Get total amount for the item
app.getItemTotalAmount = (id) => {
  const amount = app.cart[id] * app.allItems[id].price;
  return amount.toFixed(2) * 1;
};

// Get total amount
app.getTotalAmount = () => {
  let result = 0;
  Object.keys(app.cart).forEach(id => {
    result += app.getItemTotalAmount(id)
  });
  
  return result.toFixed(2) * 1;
};

// Add into cart method
app.addToCart = (id) => {
  if (id in app.cart) {
    app.cart[id]++
  } else {
    app.cart[id] = 1
  }
  
  window.localStorage.cart = JSON.stringify(app.cart);
  app.showHideCartCount(app.cart)
};

// Remove from cart method
app.removeFromCart = (id) => {
  if (id in app.cart) {
    --app.cart[id];
    if (!app.cart[id]) {
      delete app.cart[id]
    }
  }
  
  window.localStorage.cart = JSON.stringify(app.cart);
  app.showHideCartCount(app.cart)
};

// Process cart total count
app.processCartCount = () => {
  try {
    if (!Object.keys(app.cart).length) {
      app.cart = JSON.parse(window.localStorage.cart)
    }
  } catch (error) {
    app.cart = {};
  }
  app.showHideCartCount()
};

// Show or hide total cart items number
app.showHideCartCount = (cart = null) => {
  const total = app.getTotalCart(cart);
  
  const cartElement = document.querySelector('.nav-cart');
  if (cartElement) {
    if (total) {
      cartElement.setAttribute('data-total', total);
      cartElement.classList.add('cart-total-visible')
    } else {
      cartElement.classList.remove('cart-total-visible')
    }
  }
};

// Get total cart items
app.getTotalCart = (cart) => {
  let total = 0;
  
  try {
    cart = cart || JSON.parse(window.localStorage.cart);
  } catch (error) {
    cart = {};
  }
  Object.keys(cart).forEach(key => {
    total += cart[key]
  });
  
  return total;
};

// Show page data
app.showPageContent = () => {
  const body = document.querySelector('body');
  let method;
  
  switch (body.classList[0]) {
    case 'log-in-page' :
    case 'sign-up-page' : {
      method = app.applyFormHandlers;
      break;
    }
    case 'menu-page' : {
      method = app.showMenuList;
      break;
    }
    case 'cart-page' : {
      method = app.showCartList;
      break;
    }
  }
  
  if (method) {
    return method();
  }
};

// Initialize method
app.init = () => {
  app.checkAuthorization()
  .catch(app.callbacks.logServiceError)
  .then(app.callbacks.processDomComponents)
  .then(app.processCartCount)
  .then(app.showPageContent)
  .then(app.applyLogOutHandler)
  .catch(error => console.error(error))
};

// Let's get the party started!!!
document.addEventListener('DOMContentLoaded', app.init);
