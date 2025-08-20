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
src/
├── components/          # Reusable UI components
│   ├── Navbar.js       # Navigation component
│   ├── NotificationCenter.js  # Real-time notifications
│   └── ErrorBoundary.js      # Error handling
├── context/            # React Context providers
│   ├── AuthContext.js  # Authentication state
│   ├── CartContext.js  # Shopping cart management
│   └── SocketContext.js # WebSocket connections
├── pages/              # Main application pages
│   ├── HomePage.js     # Shop discovery
│   ├── ShopPage.js     # Individual shop view
│   ├── CartPage.js     # Shopping cart
│   ├── CheckoutPage.js # Payment processing
│   └── OrderHistoryPage.js # Order tracking
├── services/           # API and external services
│   └── api.js         # HTTP client and API endpoints
├── config/             # Configuration files
│   └── config.js      # Environment and app settings
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd client-customer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   REACT_APP_API_URL=https://your-backend-url.com/api
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
   REACT_APP_SOCKET_URL=https://your-backend-url.com
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API endpoint | `https://delhiveryway-backend-1.onrender.com/api` |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Test key provided |
| `REACT_APP_SOCKET_URL` | WebSocket server URL | `https://delhiveryway-backend-1.onrender.com` |
| `REACT_APP_APP_NAME` | Application name | `DelhiveryWay Customer` |

### Feature Flags

- `ENABLE_GOOGLE_OAUTH`: Enable Google OAuth login
- `ENABLE_STRIPE_PAYMENTS`: Enable Stripe payment processing
- `ENABLE_SOCKET_NOTIFICATIONS`: Enable real-time notifications

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

## Key Features Implementation

### Cart Management
The cart system uses React Context for state management with localStorage persistence:

```javascript
const { addToCart, removeFromCart, updateQuantity } = useContext(CartContext);
```

### Real-time Updates
WebSocket integration for live order status updates:

```javascript
socket.on('orderStatusUpdate', (data) => {
    // Update order status in real-time
});
```

### Payment Processing
Secure Stripe integration for checkout:

```javascript
const stripe = await stripePromise;
const result = await stripe.redirectToCheckout({
    sessionId: response.data.id
});
```

## Styling and Design

- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: ARIA labels and keyboard navigation support
- **Theme System**: CSS custom properties for consistent theming

## Error Handling

- **Error Boundaries**: React error boundaries for component-level error handling
- **API Error Handling**: Comprehensive error handling with user-friendly messages
- **Fallback UI**: Graceful degradation when services are unavailable
- **Retry Logic**: Automatic retry for failed API requests

## Performance Optimizations

- **Code Splitting**: Route-based code splitting for better performance
- **Image Optimization**: Lazy loading and error handling for images
- **Caching**: API response caching for improved user experience
- **Bundle Optimization**: Tree shaking and dead code elimination

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Deployment

### Build
```bash
npm run build
```

### Environment Setup
Ensure all environment variables are properly configured in your deployment environment.

### Static Hosting
The build output can be deployed to any static hosting service:
- Netlify
- Vercel
- AWS S3
- GitHub Pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release with core shopping functionality
- Cart management and checkout system
- Order tracking and history
- Real-time notifications
- Stripe payment integration
