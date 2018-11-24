/**
 * Client application
 */

// Main app container
const app = {};
// Callbacks container
app.callbacks = {};

// Method to perform AJAX requests
app.request = (url, {body = {}, ...options} = {}) => {
  options = {...{
      method: options.method || 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        token: app.token || 'Anonymous'
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
  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const
      fields = form.querySelectorAll('input[name]'),
      errorField = form.querySelector('.form-error'),
      fieldsets = form.querySelectorAll('fieldset'),
      callBackAttr = form.getAttribute('data-callback'),
      body = {};
    
    let isFormError = false;
    
    // Hide error message
    app.hideFormErrorMessage(errorField);
    
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
      app.showFormErrorMessage(errorField, 'Please complete all fields');
    } else {
      // Send form
      app.sendForm(form, fieldsets, errorField, body, app.callbacks[callBackAttr].bind(this, form))
    }
  });
};

// Perform form sending
app.sendForm = ({method, action: url}, fieldsets, errorField, body, callback) => {
  // Disabled all fields
  app.disableFormElements(fieldsets, true);
  app.request(url, {method, body})
  .then(response => {
    callback(response)
  }, (errorResponse) => {
    app.showFormErrorMessage(errorField, errorResponse.error);
    app.disableFormElements(fieldsets, false)
  });
};

// Disable form elements
app.disableFormElements = (fieldsets, disable) => {
  fieldsets.forEach(fieldset => {
    if (disable) {
      fieldset.setAttribute('disabled', disable);
    } else {
      fieldset.removeAttribute('disabled');
    }
  });
};

// Show form error message
app.showFormErrorMessage = (errorField, message = 'Something is wrong, please try later.') => {
  errorField.classList.remove('hidden');
  errorField.innerText = message
};

// Hide form error message
app.hideFormErrorMessage = (errorField) => {
  errorField.classList.add('hidden');
};

// Callback after successful Sign Up
app.callbacks.successSignUp = (form, response) => {
  window.location = form.getAttribute('data-redirect');
};

// Initialize method
app.init = () => {
  app.applyFormHandlers()
};

// Lets get the party started!!!
window.addEventListener('load', app.init);
