import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopsAPI, productsAPI, apiCall } from '../services/api';
import { CartContext } from '../context/CartContext';
import './ShopPage.css';

const ShopPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid');
    const { addToCart, selectedShop, setSelectedShop, cartItems, clearCart } = useContext(CartContext);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                setLoading(true);
                setError('');

                console.log('🔄 Fetching shop and products for shop ID:', id);

                // Fetch shop details
                const shopResult = await apiCall(shopsAPI.getById, id);
                console.log('🏪 Shop API response:', shopResult);
                console.log('🏪 Shop API response data:', JSON.stringify(shopResult.data, null, 2));

                if (shopResult.success && shopResult.data) {
                    console.log('✅ Shop data loaded successfully:', shopResult.data);
                    console.log('🔍 shopResult.data type:', typeof shopResult.data);
                    console.log('🔍 shopResult.data keys:', Object.keys(shopResult.data));
                    console.log('🔍 shopResult.data.shop exists?', !!shopResult.data.shop);
                    console.log('🔍 shopResult.data.shop value:', shopResult.data.shop);
                    console.log('🔍 shopResult.data._id exists?', !!shopResult.data._id);
                    console.log('🔍 shopResult.data.name exists?', !!shopResult.data.name);

                    // Let's see what keys are actually available
                    console.log('🔍 Available keys in shopResult.data:', Object.keys(shopResult.data));

                    // Check if there are nested objects
                    Object.keys(shopResult.data).forEach(key => {
                        const value = shopResult.data[key];
                        console.log(`🔍 Key "${key}":`, typeof value, value && typeof value === 'object' ? Object.keys(value) : value);
                    });

                    // Extract the shop object - be more flexible with the structure
                    let shopData = null;

                    // Try to find shop data in various possible locations
                    const possiblePaths = [
                        shopResult.data.shop,           // { data: { shop: {...} } }
                        shopResult.data.data?.shop,     // { data: { data: { shop: {...} } } }
                        shopResult.data,                // { data: {...} } (direct shop)
                        shopResult.data.data            // { data: { data: {...} } } (nested data)
                    ];

                    for (let i = 0; i < possiblePaths.length; i++) {
                        const candidate = possiblePaths[i];
                        console.log(`🔍 Trying path ${i}:`, candidate);

                        if (candidate && candidate._id && candidate.name) {
                            shopData = candidate;
                            console.log(`✅ Found valid shop data at path ${i}:`, {
                                id: shopData._id,
                                name: shopData.name
                            });
                            break;
                        }
                    }

                    if (!shopData) {
                        console.log('❌ No valid shop data found in any path, using raw data...');
                        shopData = shopResult.data;
                    }

                    // Validate we got valid shop data
                    if (!shopData || !shopData._id || !shopData.name) {
                        console.error('❌ Invalid shop data structure:', {
                            hasShopData: !!shopData,
                            hasId: !!shopData?._id,
                            hasName: !!shopData?.name,
                            shopDataType: typeof shopData,
                            shopDataKeys: shopData ? Object.keys(shopData) : [],
                            rawData: shopResult.data
                        });
                        setError('Invalid shop data received');
                        return;
                    }

                    console.log('✅ Shop extracted successfully:', {
                        id: shopData._id,
                        name: shopData.name,
                        description: shopData.description
                    });

                    setShop(shopData);

                    // Immediately update cart context with proper shop data
                    console.log('🔄 Immediately updating cart context with shop:', shopData.name);
                    setSelectedShop(shopData);
                } else {
                    console.error('Failed to fetch shop:', shopResult.message);
                    setShop(null);
                    setError(shopResult.message || 'Failed to load shop details');
                    return;
                }

                // Fetch products with better error handling
                console.log('📦 Fetching products for shop:', id);
                const productResult = await apiCall(productsAPI.getByShop, id);
                console.log('📦 Products API response:', productResult);
                console.log('📦 Product result success:', productResult.success);
                console.log('📦 Product result data:', productResult.data);
                console.log('📦 Product result data type:', typeof productResult.data);
                console.log('📦 Product result data is array:', Array.isArray(productResult.data));

                let productsData = [];
                if (productResult.success && productResult.data) {
                    // Handle different response formats
                    if (Array.isArray(productResult.data)) {
                        productsData = productResult.data;
                        console.log('✅ Using direct array format');
                    } else if (productResult.data.products && Array.isArray(productResult.data.products)) {
                        productsData = productResult.data.products;
                        console.log('✅ Using products.products format');
                    } else if (productResult.data.data && productResult.data.data.products && Array.isArray(productResult.data.data.products)) {
                        productsData = productResult.data.data.products;
                        console.log('✅ Using products.data.products format');
                    } else if (productResult.data.data && Array.isArray(productResult.data.data)) {
                        productsData = productResult.data.data;
                        console.log('✅ Using products.data format');
                    } else {
                        console.log('⚠️ Unknown data format:', productResult.data);
                        // Try to find any array in the response
                        const keys = Object.keys(productResult.data);
                        console.log('🔍 Available keys:', keys);
                        for (const key of keys) {
                            if (Array.isArray(productResult.data[key])) {
                                console.log(`🔍 Found array in key: ${key}`, productResult.data[key]);
                                productsData = productResult.data[key];
                                break;
                            } else if (productResult.data[key] && typeof productResult.data[key] === 'object') {
                                const subKeys = Object.keys(productResult.data[key]);
                                console.log(`🔍 Sub-keys in ${key}:`, subKeys);
                                for (const subKey of subKeys) {
                                    if (Array.isArray(productResult.data[key][subKey])) {
                                        console.log(`🔍 Found array in ${key}.${subKey}`, productResult.data[key][subKey]);
                                        productsData = productResult.data[key][subKey];
                                        break;
                                    }
                                }
                                if (productsData.length > 0) break;
                            }
                        }
                    }

                    console.log('✅ Products loaded successfully:', productsData.length);
                    console.log('📦 Raw products data:', productsData);

                    // Log individual product details for debugging
                    productsData.forEach((product, index) => {
                        console.log(`📦 Product ${index + 1}:`, {
                            id: product._id,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            category: product.category,
                            stockQuantity: product.stockQuantity,
                            unit: product.unit,
                            tags: product.tags,
                            images: product.images,
                            inStock: product.inStock
                        });
                    });
                } else {
                    console.warn('⚠️ API returned no products');
                    console.log('❌ Product result:', productResult);
                    setError('No products found - API may be updating');
                }

                // Ensure products have required fields
                productsData = productsData.map(product => ({
                    ...product,
                    shopId: product.shopId || id,
                    inStock: product.inStock !== undefined ? product.inStock : true,
                    price: parseFloat(product.price || 0),
                    originalPrice: parseFloat(product.originalPrice || product.price || 0)
                }));

                console.log('📦 Final products array:', productsData);
                setProducts(productsData);
                setFilteredProducts(productsData);

                // If shop data doesn't have a name, try to get it from the first product
                if (shop && (!shop.name || shop.name === 'Loading...') && productsData.length > 0) {
                    const firstProduct = productsData[0];
                    if (firstProduct.shopId && firstProduct.shopId.name) {
                        console.log('🔄 Updating shop name from product data:', firstProduct.shopId.name);
                        const updatedShop = {
                            ...shop,
                            name: firstProduct.shopId.name
                        };
                        setShop(updatedShop);
                        // Also update the cart context
                        setSelectedShop(updatedShop);
                    }
                }

            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError('Failed to load data. Please check your connection and try again.');
                setProducts([]);
                setFilteredProducts([]);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchShopAndProducts();
        }
    }, [id]);

    // Filter and sort products
    useEffect(() => {
        if (!Array.isArray(products)) {
            setFilteredProducts([]);
            return;
        }

        let filtered = [...products];

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchLower) ||
                product.description?.toLowerCase().includes(searchLower) ||
                product.category?.toLowerCase().includes(searchLower)
            );
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product =>
                product.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                default:
                    return 0;
            }
        });

        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory, sortBy]);

    // Update selected shop in cart context when shop data loads
    useEffect(() => {
        if (shop && shop._id && shop.name && shop.name !== 'Loading...') {
            console.log('🔄 Shop data loaded, updating cart context:', shop.name);
            setSelectedShop(shop);
        }
    }, [shop, setSelectedShop]);

    const handleAddToCart = (product) => {
        try {
            console.log('🛒 Adding product to cart:', product.name);
            console.log('🛒 Current shop data:', shop);
            console.log('🛒 Shop name:', shop?.name);
            console.log('🛒 Shop deliveryFee:', shop?.deliveryFee);
            console.log('🛒 Loading state:', loading);

            // Only proceed if we have proper shop data
            if (!shop || !shop._id || !shop.name || shop.name === 'Loading...') {
                console.warn('⚠️ Shop data not fully loaded, cannot add to cart yet');
                setToast('⏳ Please wait for shop data to load...');
                setTimeout(() => setToast(''), 3000);
                return;
            }

            // Use the loaded shop data with proper name
            const shopData = {
                ...shop,
                _id: shop._id,
                name: shop.name,
                deliveryFee: shop.deliveryFee || 30
            };

            // Ensure product has complete shop data including delivery fee
            const productWithShopData = {
                ...product,
                shopId: shopData // Pass the shop data with proper name
            };

            console.log('🛒 Product with shop data:', productWithShopData);
            console.log('🛒 Shop name being passed to cart:', shopData.name);
            const success = addToCart(productWithShopData, 1);
            if (success) {
                // Update the cart context with proper shop data
                setSelectedShop(shopData);
                setToast(`✅ ${product.name} added to cart`);
            } else {
                setToast('❌ Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            setToast('❌ Error adding to cart');
        }

        setTimeout(() => setToast(''), 3000);
    };

    const getCategories = () => {
        if (!Array.isArray(products)) return ['all'];

        const categories = new Set(['all']);
        products.forEach(product => {
            if (product.category) {
                categories.add(product.category.toLowerCase());
            }
        });

        return Array.from(categories);
    };

    const handleBackToShops = () => {
        navigate('/');
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSelectedCategory('all');
    };

    if (loading) {
        return (
            <div className="modern-shop-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <h3>Loading shop...</h3>
                    <p>Please wait while we fetch the shop details and products</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modern-shop-container">
                <div className="error-state">
                    <div className="error-icon">❌</div>
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button onClick={() => window.history.back()} className="back-btn">
                        <span className="back-arrow">←</span>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="modern-shop-container">
                <div className="error-state">
                    <div className="error-icon">🏪</div>
                    <h2>Shop not found</h2>
                    <p>The shop you're looking for doesn't exist or has been removed.</p>
                    <button onClick={() => navigate('/')} className="back-btn">
                        <span className="back-arrow">←</span>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-shop-container">
            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    <div className="toast-content">
                        <span className="toast-icon">✅</span>
                        <span className="toast-message">{toast}</span>
                    </div>
                </div>
            )}

            {/* Shop Hero Section */}
            <div className="shop-hero">
                <div className="shop-hero-content">
                    <button onClick={handleBackToShops} className="back-button">
                        <span>←</span> Back to Shops
                    </button>

                    {/* Debug Panel */}
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(0,0,0,0.9)',
                        padding: '15px',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        zIndex: 9999,
                        border: '2px solid #007bff',
                        minWidth: '200px'
                    }}>
                        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>🔧 DEBUG PANEL</div>
                        <div style={{ marginBottom: '5px' }}>Cart Items: {cartItems.length}</div>
                        <div style={{ marginBottom: '5px' }}>Selected Shop: {selectedShop?.name || 'None'}</div>
                        <div style={{ marginBottom: '10px' }}>Current Shop: {shop?.name || 'Loading...'}</div>

                        <button
                            onClick={() => {
                                console.log('🔍 DEBUG CART STATE:');
                                console.log('Selected Shop:', selectedShop);
                                console.log('Cart Items:', cartItems);
                                console.log('Cart Items Count:', cartItems.length);
                                if (cartItems.length > 0) {
                                    console.log('First Cart Item Shop ID:', cartItems[0].shopId?._id || cartItems[0].shopId);
                                    console.log('Current Shop ID:', shop._id);
                                    console.log('Are they different?', (cartItems[0].shopId?._id || cartItems[0].shopId) !== shop._id);
                                }
                                alert('Check console for debug info');
                            }}
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                background: '#007bff',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                marginRight: '5px',
                                marginBottom: '5px'
                            }}
                        >
                            Debug Cart
                        </button>
                        <button
                            onClick={() => {
                                console.log('🧹 CLEARING CART...');
                                clearCart();
                                console.log('✅ Cart cleared!');
                                alert('Cart cleared!');
                            }}
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                background: '#dc3545',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                marginBottom: '5px'
                            }}
                        >
                            Clear Cart
                        </button>
                        <br />
                        <button
                            onClick={() => {
                                // Test adding an item
                                if (products.length > 0) {
                                    const testProduct = products[0];
                                    console.log('🧪 TESTING ADD TO CART:', testProduct.name);
                                    addToCart(testProduct, 1);
                                }
                            }}
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                background: '#28a745',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Test Add Item
                        </button>
                    </div>

                    <div className="shop-main-info">
                        <div className="shop-avatar">
                            {shop.images && shop.images.length > 0 ? (
                                <img src={shop.images[0]} alt={shop.name} />
                            ) : (
                                <span className="shop-emoji">🏪</span>
                            )}
                        </div>

                        <div className="shop-details">
                            <h1 className="shop-name">
                                {shop.name}
                                {process.env.NODE_ENV === 'development' && (
                                    <small style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                        Debug: "{shop.name}" (ID: {shop._id})
                                    </small>
                                )}
                                <button
                                    onClick={() => {
                                        console.log('🔍 DEBUG CART STATE:');
                                        console.log('Selected Shop:', selectedShop);
                                        console.log('Cart Items:', cartItems);
                                        console.log('Cart Items Count:', cartItems.length);
                                        if (cartItems.length > 0) {
                                            console.log('First Cart Item Shop ID:', cartItems[0].shopId?._id || cartItems[0].shopId);
                                            console.log('Current Shop ID:', shop._id);
                                            console.log('Are they different?', (cartItems[0].shopId?._id || cartItems[0].shopId) !== shop._id);
                                        }
                                    }}
                                    style={{
                                        marginLeft: '10px',
                                        padding: '5px 10px',
                                        fontSize: '10px',
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Debug Cart
                                </button>
                            </h1>
                            <p className="shop-description">{shop.description || 'Welcome to our shop!'}</p>

                            <div className="shop-meta">
                                {shop.rating && (
                                    <div className="meta-item">
                                        <span className="meta-icon">⭐</span>
                                        <span className="meta-text">{shop.rating.average?.toFixed(1) || '4.0'} ({shop.rating.count || 0} reviews)</span>
                                    </div>
                                )}

                                <div className="meta-item">
                                    <span className="meta-icon">📦</span>
                                    <span className="meta-text">{products.length} products</span>
                                </div>

                                {/* Hide delivery fee on shop page as requested */}
                                {/* {shop.deliveryFee !== undefined && (
                                    <div className="meta-item">
                                        <span className="meta-icon">🚚</span>
                                        <span className="meta-text">{shop.deliveryFee === 0 ? 'Free delivery' : `₹${shop.deliveryFee} delivery`}</span>
                                    </div>
                                )} */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Controls Section */}
            <div className="shop-controls">
                <div className="controls-content">
                    <div className="search-and-filters">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <span className="search-icon">🔍</span>
                        </div>

                        <div className="filters-container">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="category-filter"
                            >
                                {getCategories().map(category => (
                                    <option key={category} value={category}>
                                        {category === 'all' ? 'All Categories' :
                                            category.charAt(0).toUpperCase() + category.slice(1)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-filter"
                            >
                                <option value="name">Sort by Name</option>
                                <option value="price">Sort by Price</option>
                                <option value="price-desc">Sort by Price (High to Low)</option>
                            </select>
                        </div>
                    </div>

                    <div className="view-controls">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            <span className="view-icon">⊞</span>
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            <span className="view-icon">☰</span>
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="products-section">
                <div className="products-header">
                    <h2 className="products-title">
                        {searchTerm ? `Search Results for "${searchTerm}"` : 'Our Products'}
                    </h2>
                    <span className="products-count">
                        {filteredProducts.length} of {products.length} products
                    </span>
                </div>

                {/* Temporary Debug Section */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="debug-section" style={{ background: '#f5f5f5', padding: '1rem', margin: '1rem 0', borderRadius: '8px', fontSize: '12px' }}>
                        <h4>🔍 Debug Info:</h4>
                        <p><strong>Total Products:</strong> {products.length}</p>
                        <p><strong>Filtered Products:</strong> {filteredProducts.length}</p>
                        <p><strong>Raw Products Data:</strong></p>
                        <pre style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
                            {JSON.stringify(products, null, 2)}
                        </pre>
                    </div>
                )}

                {filteredProducts.length === 0 ? (
                    <div className="no-products">
                        <div className="no-products-icon">📦</div>
                        <h3>No Products Found</h3>
                        <p>
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'This shop doesn\'t have any products yet'
                            }
                        </p>
                        {(searchTerm || selectedCategory !== 'all') && (
                            <button onClick={clearSearch} className="clear-search-btn">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`products-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                        {filteredProducts.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-image-section">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="product-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="product-placeholder" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                                        <span className="product-icon">📦</span>
                                    </div>
                                </div>

                                <div className="product-content">
                                    <div className="product-header">
                                        <h3 className="product-name">
                                            <span className="product-name-main">
                                                {product.name || 'Unnamed Product'}
                                            </span>
                                        </h3>

                                        {product.description ? (
                                            <p className="product-description">
                                                {product.description.length > 80
                                                    ? `${product.description.substring(0, 80)}...`
                                                    : product.description
                                                }
                                            </p>
                                        ) : (
                                            <p className="product-description no-description">
                                                No description available
                                            </p>
                                        )}
                                    </div>

                                    {/* Product details section */}
                                    <div className="product-details">
                                        {product.stockQuantity !== undefined && (
                                            <span className="stock-info">
                                                📦 Stock: {product.stockQuantity} {product.unit || 'units'}
                                            </span>
                                        )}

                                        {product.tags && product.tags.length > 0 && (
                                            <div className="product-tags">
                                                {product.tags.slice(0, 3).map((tag, index) => (
                                                    <span key={index} className="tag">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="product-footer">
                                        <div className="product-price-section">
                                            <span className="product-price">
                                                ₹{product.price?.toFixed(2) || '0.00'}
                                            </span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <span className="original-price">
                                                    ₹{product.originalPrice.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="add-to-cart-btn"
                                            disabled={!product.inStock}
                                        >
                                            <span className="cart-icon">🛒</span>
                                            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPage;