# AURA API Specification

This document outlines the API endpoints, models, and authorization flows exposed by the **AURA Backend API** server at `http://localhost:8080`.

---

## 🔒 JWT Authentication Flow

All secured requests must include a JWT in the request header:
`Authorization: Bearer <token>`

---

## 📡 Endpoint Summary

### 1. Authentication (`/api/auth`)

#### POST `/api/auth/signup`
- **Description**: Registers a new user account with role `ROLE_USER`.
- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`: `"User registered successfully!"`
  - `400 Bad Request`: Validation errors or username/email already taken.

#### POST `/api/auth/signin`
- **Description**: Authenticates user credentials and returns a JWT.
- **Request Body**:
  ```json
  {
    "username": "john_doe",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns JWT Token and user roles data.
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiJ9...",
      "type": "Bearer",
      "id": 2,
      "username": "john_doe",
      "email": "john@example.com",
      "roles": ["ROLE_USER"]
    }
    ```
  - `401 Unauthorized`: Bad credentials.

---

### 2. Product Catalog (`/api/products`)

#### GET `/api/products`
- **Description**: Returns a list of all products, categories, and brands.
- **Responses**:
  - `200 OK`: Array of product objects.

#### GET `/api/products/{id}`
- **Description**: Finds product details by numerical ID.

#### GET `/api/products/slug/{slug}`
- **Description**: Finds product by unique URL slug.

---

### 3. Shopping Cart (`/api/cart`) [Secured]

#### GET `/api/cart`
- **Description**: Gets the current customer's cart list and items count.
- **Responses**:
  - `200 OK`: Cart object containing user info and cart items list.

#### POST `/api/cart/items`
- **Description**: Adds an item to the shopping bag.
- **Query Params**:
  - `productId` (Long, Required)
  - `quantity` (Integer, Required)
- **Responses**:
  - `200 OK`: `"Item added to cart successfully"`

#### DELETE `/api/cart/items/{productId}`
- **Description**: Deletes a product line from the cart.

---

### 4. Admin Analytics (`/api/analytics`) [Admin Only]

#### GET `/api/analytics/dashboard`
- **Description**: Retrieves totals for revenues, orders, active users, and low stock metrics.
- **Responses**:
  - `200 OK`: JSON metrics object.
    ```json
    {
      "totalRevenue": 124850.00,
      "ordersCount": 412,
      "activeUsers": 1430,
      "lowStockCount": 3,
      "monthlySales": [12000, 15000, 18000, 14000, 22000, 26000]
    }
    ```
