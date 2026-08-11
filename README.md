# DelhiveryWay Customer Portal

A modern, responsive customer portal for the DelhiveryWay delivery platform built with React.

## Features

### 🛍️ Shopping Experience

- **Shop Discovery**: Browse and search through available shops by category
- **Product Browsing**: View products with images, descriptions, and pricing
- **Smart Cart Management**: Add items to cart with quantity controls and notes
- **Multi-shop Support**: Shop from different stores with automatic cart management

### 🛒 Cart & Checkout

- **Persistent Cart**: Cart data saved locally for seamless shopping
- **Order Summary**: Detailed breakdown of costs including taxes and delivery fees
- **Secure Checkout**: Integrated Stripe payment processing
- **Address Management**: Easy delivery address input and validation

### 📦 Order Management

- **Order History**: Complete order tracking and history
- **Real-time Updates**: Live order status updates via WebSocket
- **Order Details**: Comprehensive order information and item breakdowns
- **Status Tracking**: Visual status indicators for order progress

### 🔐 User Management

- **Authentication**: Secure login and registration system
- **Profile Management**: User profile and preferences
- **Password Recovery**: Forgot password and reset functionality
- **Session Management**: Secure token-based authentication

## Technology Stack

- **Frontend**: React 19.1.0 with modern hooks
- **Routing**: React Router DOM 7.6.2
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors and retry logic
- **Real-time**: Socket.io client for live updates
- **Payments**: Stripe integration for secure transactions
- **Styling**: CSS3 with modern design patterns
- **Build Tool**: Create React App 5.0.1

## Project Structure

```
delhiveryway-customer/
├── .env.development            # Committed, non-secret dev config (see backend README)
├── env.example                 # Template for a real .env (production)
├── package.json
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── favicon.ico / logo192.png / logo512.png / delhiveryway-logo.jpg
│   ├── notification.mp3        # Sound played on live order notifications
│   └── robots.txt
├── design/                     # Design reference assets
└── src/
    ├── App.js                  # Root component and route definitions
    ├── index.js / index.css    # App entry point and global styles
    ├── context/                 # React Context providers
    │   ├── AuthContext.js       # Authentication state
    │   ├── CartContext.js       # Shopping cart management
    │   ├── SearchContext.js     # Shop/product search state
    │   └── SocketContext.js     # WebSocket connection & notifications
    ├── modules/                 # Feature modules
    │   ├── auth/                 # Login, signup, password reset, email verification
    │   ├── cart/                 # Cart, final checkout, order success
    │   ├── core/                 # Navbar, Footer, NotificationCenter, ScrollToTop,
    │   │                         #   TermsModal, HelpAssistant, ErrorBoundary, Logo
    │   ├── home/                 # HomePage, search, active-orders widget, notices
    │   ├── orders/                # Order confirmation, history, revised orders,
    │   │                         #   live socket order handler
    │   ├── shop/                 # ShopPage, product inquiries
    │   ├── static/                # About, Careers, Partner, Terms pages
    │   └── user/                  # Profile page, community page
    ├── services/
    │   └── api.js                 # Axios instance and API endpoint calls
    ├── utils/                     # geocoding, delivery-fee calculation, storage cleanup
    └── config/
        └── config.js               # Environment and app settings
```

## API Integration

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Shop Endpoints

- `GET /shops` - List all shops
- `GET /shops/:id` - Get shop details
- `GET /shops/search` - Search shops
- `GET /shops/category/:category` - Get shops by category

### Product Endpoints

- `GET /products/shop/:shopId` - Get products by shop
- `GET /products/:id` - Get product details
- `GET /products/search` - Search products

### Order Endpoints

- `POST /orders` - Create new order
- `GET /orders/customer` - Get customer orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/cancel` - Cancel order

### Payment Endpoints

- `POST /payment/create-checkout-session` - Create Stripe checkout session
- `POST /payment/confirm` - Confirm payment

## Getting Started

For the complete local development setup — installing WSL, Docker, Node, cloning
all five DelhiveryWay repos, seeding the database, and running everything
together — see the
[`backend` repo's README](https://github.com/mnpatel007/delhiveryway-backend#readme).
That's the single source of truth for setup; once it's done, come back here and
run `npm start` in this repo (`http://localhost:3000`).
