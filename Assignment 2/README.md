# **Welcome to pizza-delivery company API**

## Fast start:
1. Create new account:

    **POST /users**
  ```
Payload

{
   "name": "Eugene",
   "email": "eugene.vasilevsky@gmail.com",
   "address": "Panchenko 22-19",
   "password": "123321"
}

  ```
  
2. Get token:

    **POST /tokens**
```
Payload

{
   "email": "eugene.vasilevsky@gmail.com",
   "password": "123321"
}

Response

{
    "email": "eugene.vasilevsky@gmail.com",
    "expires": 1542061463959,
    "id": "2wxsw0rka5t4hkqms71p"
}
```
Provide the **id** for futher requests in token header
```
token: <id>
```

3. Get menu items:

    **GET /menu?email=\<email\>**

```
Response example

{
    "souce": [
        {
            "name": "Chermoula",
            "price": 0.05,
            "type": "Sauce",
            "id": "s_1"
        },
        {
            "name": "Harissa",
            "price": 0.39,
            "type": "Sauce",
            "id": "s_2"
        }
    ],
    "pizza": [
        {
            "name": "Neapolitan",
            "price": 5.05,
            "type": "Pizza",
            "id": "p_1"
        },
        {
            "name": "Chicago",
            "price": 4.39,
            "type": "Pizza",
            "id": "p_2"
        }
    ]
}
```
Each item has **id** property, use the **id** to make an order

4. Make order:

    **POST /cart**
```
Request example

{
   "email": "eugene.vasilevsky@gmail.com",
   "cart": ["s_1", "p_1", "p_2"]
}
```
If there are no errors, a receipt will be sent to the user's email

# FULL API

Get user profile:

**GET /users?email=\<email\>**

Update user profile:

**PUT /users**
```
Payload

{
  "name": <name>,
  "email": <email>,
  "address": <address>,
  "password": <password>
}
```

Delete user profile:

**DELETE /users?email=\<email\>**

Get token:

**GET /tokens?email=\<email\>**

Extend token:

**PUT /tokens**
```
Payload

{
  "id": <id>,
  "extend": true
}

```

Delete a token:

**DELETE /tokens?id=\<id\>**

