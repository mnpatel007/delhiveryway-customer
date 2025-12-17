import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { shopsAPI, productsAPI, apiCall } from '../services/api';
import { CartContext } from '../context/CartContext';
import './ShopPage.css';

const ShopPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
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
    const [showMenu, setShowMenu] = useState(false);
    const { addToCart, selectedShop, setSelectedShop } = useContext(CartContext);
    const productRefsMap = useRef({});

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
                    // console.log('📦 Raw products data:', productsData);

                    // Log individual product details for debugging (disabled in production)
                    if (process.env.NODE_ENV === 'development') {
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
                    }
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

    // Scroll to highlighted product when it loads
    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (highlightId && filteredProducts.length > 0 && productRefsMap.current[highlightId]) {
            const element = productRefsMap.current[highlightId];
            if (element) {
                // Scroll with offset for smooth behavior
                const elementRect = element.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.scrollY;
                window.scrollTo({
                    top: absoluteElementTop - 100,
                    behavior: 'smooth'
                });

                // Add highlight animation
                element.classList.add('highlighted');
                setTimeout(() => {
                    element.classList.remove('highlighted');
                }, 2000);
            }
        }
    }, [filteredProducts, searchParams]);

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

    // Helper function to check if shop is currently open
    const isShopOpen = (shop) => {
        if (!shop?.operatingHours) return true; // Default to open if no hours defined

        // Get current time in IST (Indian Standard Time)
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = dayNames[istTime.getDay()];
        const currentTime = istTime.toTimeString().slice(0, 5);

        const todayHours = shop.operatingHours[day];
        if (!todayHours || todayHours.closed) return false;

        if (!todayHours.open || !todayHours.close) return true;

        return currentTime >= todayHours.open && currentTime <= todayHours.close;
    };

    // Helper function to get shop status message
    const getShopStatusMessage = (shop) => {
        if (!shop?.operatingHours) return { isOpen: true, message: 'Open' };

        // Get current time in IST (Indian Standard Time)
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = dayNames[istTime.getDay()];
        const currentTime = istTime.toTimeString().slice(0, 5);

        const todayHours = shop.operatingHours[day.toLowerCase()];

        if (!todayHours || todayHours.closed) {
            return {
                isOpen: false,
                message: `Closed on ${day}s`,
                nextOpen: getNextOpenTime(shop, now)
            };
        }

        if (!todayHours.open || !todayHours.close) {
            return { isOpen: true, message: 'Open' };
        }

        const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;

        if (isOpen) {
            return {
                isOpen: true,
                message: `Open until ${todayHours.close}`,
                closingTime: todayHours.close
            };
        } else if (currentTime < todayHours.open) {
            return {
                isOpen: false,
                message: `Opens at ${todayHours.open}`,
                openingTime: todayHours.open
            };
        } else {
            return {
                isOpen: false,
                message: `Closed (was open until ${todayHours.close})`,
                nextOpen: getNextOpenTime(shop, now)
            };
        }
    };

    // Helper function to get next opening time
    const getNextOpenTime = (shop, currentDate) => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayNamesDisplay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (let i = 1; i <= 7; i++) {
            const nextDay = new Date(currentDate);
            nextDay.setDate(nextDay.getDate() + i);
            const dayIndex = nextDay.getDay();
            const dayName = dayNames[dayIndex];
            const dayHours = shop.operatingHours?.[dayName];

            if (dayHours && !dayHours.closed && dayHours.open) {
                return `${dayNamesDisplay[dayIndex]} at ${dayHours.open}`;
            }
        }

        return 'Check shop hours';
    };

    const handleAddToCart = (product) => {
        try {
            // Only proceed if we have proper shop data
            if (!shop || !shop._id || !shop.name || shop.name === 'Loading...') {
                setToast('⏳ Please wait for shop data to load...');
                setTimeout(() => setToast(''), 3000);
                return;
            }

            // Use the loaded shop data with proper name
            const shopData = {
                ...shop,
                _id: shop._id,
                name: shop.name,
                deliveryFee: shop.deliveryFee || 30,
                hasTax: shop.hasTax || false,
                taxRate: shop.taxRate || 5
            };

            // Ensure product has complete shop data including delivery fee
            const productWithShopData = {
                ...product,
                shopId: shop._id, // Pass just the shop ID as string
                shopData: shopData // Pass full shop data separately
            };

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


                    <div className="shop-main-info">
                        <div className="shop-avatar">
                            <img
                                src={shop.images && shop.images.length > 0 ? shop.images[0] : `https://image.pollinations.ai/prompt/modern%20restaurant%20logo%20${encodeURIComponent(shop.name)}%20minimalist%20professional?width=200&height=200&nologo=true`}
                                alt={shop.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    if (!e.target.src.includes('pollinations.ai')) {
                                        e.target.src = `https://image.pollinations.ai/prompt/modern%20restaurant%20logo%20${encodeURIComponent(shop.name)}%20minimalist%20professional?width=200&height=200&nologo=true`;
                                    } else {
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = '<span class="shop-emoji">🏪</span>';
                                    }
                                }}
                            />
                        </div>

                        <div className="shop-details">
                            <h1 className="shop-name">
                                {shop.name}
                                {process.env.NODE_ENV === 'development' && (
                                    <small style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                        Debug: "{shop.name}" (ID: {shop._id})
                                    </small>
                                )}
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

                                {/* Shop Hours Status - CRITICAL INFORMATION */}
                                {(() => {
                                    const status = getShopStatusMessage(shop);
                                    return (
                                        <div className={`meta-item shop-status ${status.isOpen ? 'open' : 'closed'}`}>
                                            <span className="meta-icon">{status.isOpen ? '🟢' : '🔴'}</span>
                                            <span className="meta-text shop-hours-text">
                                                {status.message}
                                            </span>
                                        </div>
                                    );
                                })()}

                                {/* Hide delivery fee on shop page as requested */}
                                {/* {shop.deliveryFee !== undefined && (
                                    <div className="meta-item">
                                        <span className="meta-icon">🚚</span>
                                        <span className="meta-text">{shop.deliveryFee === 0 ? 'Free delivery' : `₹${shop.deliveryFee} delivery`}</span>
                                    </div>
                                )} */}
                            </div>

                            {/* View Menu button moved to controls section */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-screen Menu Overlay */}
            {showMenu && (
                <div
                    className="menu-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        zIndex: 9998,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        overflowY: 'auto'
                    }}
                    onClick={(e) => {
                        // close only when backdrop clicked
                        if (e.target.classList.contains('menu-overlay')) setShowMenu(false);
                    }}
                >
                    <div
                        className="menu-panel"
                        style={{
                            background: '#fff',
                            width: 'min(900px, 92vw)',
                            margin: '40px 16px',
                            borderRadius: '12px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 1,
                            background: '#ffffffee', backdropFilter: 'saturate(180%) blur(6px)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 16px', borderBottom: '1px solid #eee', borderTopLeftRadius: '12px', borderTopRightRadius: '12px'
                        }}>
                            <div style={{ fontWeight: 800, fontSize: '18px' }}>
                                {shop?.name || 'Menu'} · {products.length} items
                            </div>
                            <div>
                                <button
                                    onClick={() => setShowMenu(false)}
                                    style={{
                                        background: 'transparent',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        {/* Simple one-page menu list */}
                        <div style={{ padding: '8px 0 12px' }}>
                            {products.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No items available.</div>
                            ) : (
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                    {products.map((item) => (
                                        <li key={item._id} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '72px 1fr auto',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #f0f0f0',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ width: 72, height: 72, borderRadius: 8, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                <img
                                                    src={item.images && item.images.length > 0 ? item.images[0] : `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(item.name.replace(/[()]/g, '').replace(/[^a-zA-Z0-9 ]/g, ''))}%20dish%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true`}
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        const cleanName = item.name.replace(/[()]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
                                                        const aiUrl = `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(cleanName)}%20dish%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true`;

                                                        if (e.target.src !== aiUrl) {
                                                            e.target.src = aiUrl;
                                                        } else {
                                                            e.target.style.display = 'none';
                                                            e.target.parentNode.innerHTML = '<span style="font-size: 24px">🍽️</span>';
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                                {item.description && (
                                                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                                                        {item.description}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12, color: '#555' }}>
                                                    {item.category && <span>🏷️ {item.category}</span>}
                                                    {item.stockQuantity !== undefined && <span>📦 {item.stockQuantity} {item.unit || 'units'}</span>}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                <div style={{ fontWeight: 800, color: '#111' }}>₹{(item.price || 0).toFixed(2)}</div>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    disabled={!item.inStock}
                                                    style={{
                                                        background: item.inStock ? '#198754' : '#adb5bd',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 10px',
                                                        borderRadius: '8px',
                                                        cursor: item.inStock ? 'pointer' : 'not-allowed',
                                                        fontWeight: 700,
                                                        minWidth: 110
                                                    }}
                                                >
                                                    {item.inStock ? 'Add' : 'Out of stock'}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

                    <div className="view-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* View Menu button placed to the left of Grid/List */}
                        <button
                            onClick={() => setShowMenu(true)}
                            className="view-menu-btn"
                            style={{
                                background: '#0d6efd',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            📖 View Menu
                        </button>
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

                {/* Debug Section - Development Only */}
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
                            <div
                                key={product._id}
                                className="product-card"
                                ref={(el) => {
                                    if (el) productRefsMap.current[product._id] = el;
                                }}
                            >
                                <div className="product-image-section">
                                    <img
                                        src={product.images && product.images.length > 0 ? product.images[0] : `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(product.name.replace(/[()]/g, '').replace(/[^a-zA-Z0-9 ]/g, ''))}%20dish%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true`}
                                        alt={product.name}
                                        className="product-image"
                                        onError={(e) => {
                                            const cleanName = product.name.replace(/[()]/g, '').replace(/[^a-zA-Z0-9 ]/g, '');
                                            const aiUrl = `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(cleanName)}%20dish%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true`;

                                            if (e.target.src !== aiUrl) {
                                                e.target.src = aiUrl;
                                            } else {
                                                e.target.style.display = 'none';
                                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                    <div className="product-placeholder" style={{ display: 'none' }}>
                                        <span className="product-icon">🍽️</span>
                                    </div>
                                </div>

                                <div className="product-content">
                                    <div className="product-header">
                                        <h3 className="product-name">
                                            <span className="product-name-main">
                                                {product.name || 'Unnamed Product'}
                                            </span>
                                        </h3>

                                        {product.description && product.description !== '.' ? (
                                            <p className="product-description">
                                                {product.description.length > 80
                                                    ? `${product.description.substring(0, 80)}...`
                                                    : product.description
                                                }
                                            </p>
                                        ) : null}
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