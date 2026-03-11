
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopsAPI, productsAPI, apiCall } from '../../services/api'; // Keep shopsAPI and productsAPI if used later
import { CartContext } from '../../context/CartContext';
import './ShopPage.css';
const FOOD_PROMPTS = [
    'professional food photography high resolution dark background',
    'gourmet meal editorial food magazine photo',
    'mouth-watering food photography dark mood lighting',
    'food blogging top down shot colorful',
    'appetizing fresh hot food realistic detail'
];

const getCleanImgQuery = (name, index = 0) => {
    if (!name) return 'delicious food gourmet';
    let q = name.replace(/\([^)]+\)/g, '').trim();
    q = q.replace(/[0-9]+(kg|g|ml|l|pcs|piece)/gi, '').trim();
    const variant = FOOD_PROMPTS[index % FOOD_PROMPTS.length]; // Updated to use FOOD_PROMPTS
    return encodeURIComponent(q + ' ' + variant);
};


const ShopPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [groupedProducts, setGroupedProducts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [toast, setToast] = useState('');
    const [imageIndexes, setImageIndexes] = useState({});

    const { addToCart, setSelectedShop } = useContext(CartContext);
    const { isAdmin } = useAuth(); // Assuming isAdmin is provided by useAuth

    // Refs for scrolling and observing
    const categoryRefs = useRef({});
    const observerRef = useRef(null);

    const saveAiImage = async (productId, imageUrl) => {
        try {
            const res = await apiCall(productsAPI.update, productId, { aiImage: imageUrl });
            if (res.success) {
                const updatedProducts = products.map(p => p._id === productId ? { ...p, aiImage: imageUrl } : p);
                setProducts(updatedProducts);
                setToast('Image saved permanently for all users!');
                setTimeout(() => setToast(''), 3000);
            } else {
                setToast(res.message || 'Failed to save image');
                setTimeout(() => setToast(''), 3000);
            }
        } catch (error) {
            console.error(error);
            setToast('Failed to save image');
            setTimeout(() => setToast(''), 3000);
        }
    };

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                setLoading(true);
                setError('');

                console.log('� Fetching shop and products for shop ID:', id);

                // Fetch shop details
                const shopResult = await apiCall(shopsAPI.getById, id);
                console.log(' Shop API response:', shopResult);
                console.log(' Shop API response data:', JSON.stringify(shopResult.data, null, 2));

                if (shopResult.success && shopResult.data) {
                    console.log('[SUCCESS] Shop data loaded successfully:', shopResult.data);
                    console.log('[DEBUG] shopResult.data type:', typeof shopResult.data);
                    console.log('[DEBUG] shopResult.data keys:', Object.keys(shopResult.data));
                    console.log('[DEBUG] shopResult.data.shop exists?', !!shopResult.data.shop);
                    console.log('[DEBUG] shopResult.data.shop value:', shopResult.data.shop);
                    console.log('[DEBUG] shopResult.data._id exists?', !!shopResult.data._id);
                    console.log('[DEBUG] shopResult.data.name exists?', !!shopResult.data.name);

                    // Let's see what keys are actually available
                    console.log('[DEBUG] Available keys in shopResult.data:', Object.keys(shopResult.data));

                    // Check if there are nested objects
                    Object.keys(shopResult.data).forEach(key => {
                        const value = shopResult.data[key];
                        const logVal = value && typeof value === 'object' ? Object.keys(value) : value;
                        console.log('[DEBUG] Key "' + key + '": ', typeof value, logVal);
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
                        console.log('[DEBUG] Trying path ' + i + ': ', candidate);

                        if (candidate && candidate._id && candidate.name) {
                            shopData = candidate;
                            console.log('[SUCCESS] Found valid shop data at path ' + i + ': ', {
                                id: shopData._id,
                                name: shopData.name
                            });
                            break;
                        }
                    }

                    if (!shopData) {
                        console.log('[ERROR] No valid shop data found in any path, using raw data...');
                        shopData = shopResult.data;
                    }

                    // Validate we got valid shop data
                    if (!shopData || !shopData._id || !shopData.name) {
                        console.error('[ERROR] Invalid shop data structure:', {
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

                    console.log(' Shop extracted successfully:', {
                        id: shopData._id,
                        name: shopData.name,
                        description: shopData.description
                    });

                    setShop(shopData);

                    // Immediately update cart context with proper shop data
                    console.log('� Immediately updating cart context with shop:', shopData.name);
                    setSelectedShop(shopData);
                } else {
                    console.error('Failed to fetch shop:', shopResult.message);
                    setShop(null);
                    setError(shopResult.message || 'Failed to load shop details');
                    return;
                }

                // Fetch products with better error handling
                console.log(' Fetching products for shop:', id);
                const productResult = await apiCall(productsAPI.getByShop, id);
                console.log(' Products API response:', productResult);
                console.log(' Product result success:', productResult.success);
                console.log(' Product result data:', productResult.data);
                console.log(' Product result data type:', typeof productResult.data);
                console.log(' Product result data is array:', Array.isArray(productResult.data));

                let productsData = [];
                if (productResult.success && productResult.data) {
                    // Handle different response formats
                    if (Array.isArray(productResult.data)) {
                        productsData = productResult.data;
                        console.log(' Using direct array format');
                    } else if (productResult.data.products && Array.isArray(productResult.data.products)) {
                        productsData = productResult.data.products;
                        console.log(' Using products.products format');
                    } else if (productResult.data.data && productResult.data.data.products && Array.isArray(productResult.data.data.products)) {
                        productsData = productResult.data.data.products;
                        console.log(' Using products.data.products format');
                    } else if (productResult.data.data && Array.isArray(productResult.data.data)) {
                        productsData = productResult.data.data;
                        console.log(' Using products.data format');
                    } else {
                        console.log(' Unknown data format:', productResult.data);
                        // Try to find any array in the response
                        const keys = Object.keys(productResult.data);
                        console.log(' Available keys:', keys);
                        for (const key of keys) {
                            if (Array.isArray(productResult.data[key])) {
                                console.log(' Found array in key: ' + key + ' ', productResult.data[key]);
                                productsData = productResult.data[key];
                                break;
                            } else if (productResult.data[key] && typeof productResult.data[key] === 'object') {
                                const subKeys = Object.keys(productResult.data[key]);
                                console.log(' Sub - keys in ' + key + ': ', subKeys);
                                for (const subKey of subKeys) {
                                    if (Array.isArray(productResult.data[key][subKey])) {
                                        console.log(' Found array in ' + key + '.' + subKey + ' ', productResult.data[key][subKey]);
                                        productsData = productResult.data[key][subKey];
                                        break;
                                    }
                                }
                                if (productsData.length > 0) break;
                            }
                        }
                    }

                    console.log(' Products loaded successfully:', productsData.length);
                    // console.log(' Raw products data:', productsData);

                    // Log individual product details for debugging (disabled in production)
                    if (process.env.NODE_ENV === 'development') {
                        productsData.forEach((product, index) => {
                            console.log(' Product ' + (index + 1) + ': ', {
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
                    console.warn(' API returned no products');
                    console.log(' Product result:', productResult);
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

                console.log(' Final products array:', productsData);
                setProducts(productsData);

                // If shop data doesn't have a name, try to get it from the first product
                if (shop && (!shop.name || shop.name === 'Loading...') && productsData.length > 0) {
                    const firstProduct = productsData[0];
                    if (firstProduct.shopId && firstProduct.shopId.name) {
                        console.log('� Updating shop name from product data:', firstProduct.shopId.name);
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
                console.error(' Error fetching data:', err);
                setError('Failed to load data. Please check your connection and try again.');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchShopAndProducts();
        }
    }, [id]);

    // Group products and setup intersection observer for scroll spy
    useEffect(() => {
        if (!Array.isArray(products) || products.length === 0) {
            setGroupedProducts({});
            return;
        }

        let filtered = [...products];

        // Apply search filter globally
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchLower) ||
                product.description?.toLowerCase().includes(searchLower) ||
                product.category?.toLowerCase().includes(searchLower)
            );
        }

        // Group by category
        const grouped = filtered.reduce((acc, product) => {
            const cat = product.category || 'Uncategorized';
            if (!acc[cat]) {
                acc[cat] = [];
            }
            acc[cat].push(product);
            return acc;
        }, {});

        // Sort items within categories by name
        Object.keys(grouped).forEach(cat => {
            grouped[cat].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });

        setGroupedProducts(grouped);

        // Setup observer after grouping
        // We defer this slightly so the DOM has time to render the new sections
        setTimeout(() => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            observerRef.current = new IntersectionObserver((entries) => {
                // Find the first intersecting entry
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveCategory(entry.target.id);
                        break;
                    }
                }
            }, {
                rootMargin: '-10% 0px -80% 0px' // Trigger when section is near the top
            });

            Object.values(categoryRefs.current).forEach(ref => {
                if (ref) observerRef.current.observe(ref);
            });
        }, 100);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [products, searchTerm]);

    const scrollToCategory = (categoryId) => {
        setActiveCategory(categoryId);
        const element = categoryRefs.current[categoryId];
        if (element) {
            const yOffset = -20; // Slight offset so header doesn't get hidden under fixed elements if any
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Update selected shop in cart context when shop data loads
    useEffect(() => {
        if (shop && shop._id && shop.name && shop.name !== 'Loading...') {
            console.log('� Shop data loaded, updating cart context:', shop.name);
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
                message: 'Closed on ' + day + 's',
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
                message: 'Open until ' + todayHours.close + ' ',
                closingTime: todayHours.close
            };
        } else if (currentTime < todayHours.open) {
            return {
                isOpen: false,
                message: 'Opens at ' + todayHours.open + ' ',
                openingTime: todayHours.open
            };
        } else {
            return {
                isOpen: false,
                message: 'Closed(was open until ' + todayHours.close + ')',
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
                return dayNamesDisplay[dayIndex] + ' at ' + dayHours.open + ' ';
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
                setToast(' ' + product.name + ' added to cart');
            } else {
                setToast(' Failed to add to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            setToast(' Error adding to cart');
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
        setActiveCategory('');
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
                    <div className="error-icon"></div>
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
                    <div className="error-icon"></div>
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
                        <span className="toast-icon"></span>
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
                            {shop.images && shop.images.length > 0 ? (
                                <img src={shop.images[0]} alt={shop.name} />
                            ) : (
                                <span className="shop-emoji"></span>
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
                            </h1>
                            <p className="shop-description">{shop.description || 'Welcome to our shop!'}</p>

                            <div className="shop-meta">
                                {shop.rating && (
                                    <div className="meta-item">
                                        <span className="meta-icon">★</span>
                                        <span className="meta-text">{shop.rating.average?.toFixed(1) || '4.0'} ({shop.rating.count || 0}+ ratings)</span>
                                    </div>
                                )}

                                {/* Shop Hours Status */}
                                {(() => {
                                    const status = getShopStatusMessage(shop);
                                    return (
                                        <div className={'meta-item shop-status ' + (status.isOpen ? 'open' : 'closed')}>
                                            <span className="meta-text shop-hours-text">
                                                {status.message}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Shop Layout container: Sidebar + Content */}
            <div className="shop-layout">
                {/* Left Sticky Sidebar for Categories */}
                <aside className="sticky-sidebar">
                    <div className="search-container modern-search">
                        <span className="search-icon"></span>
                        <input
                            type="text"
                            placeholder="Search in store..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <ul className="category-nav-list">
                        {Object.keys(groupedProducts).length === 0 && (
                            <li className="category-nav-item">No categories</li>
                        )}
                        {Object.keys(groupedProducts).map(category => (
                            <li
                                key={category}
                                className={'category-nav-item ' + (activeCategory === category ? 'active' : '')}
                                onClick={() => scrollToCategory(category)}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Products Section */}
                <div className="products-section modern-products-feed">
                    <div className="products-feed-header">
                        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', paddingBottom: '16px' }}>
                            * Image is just for show purpose, the actual appearance and taste may differ
                        </div>
                    </div>

                    {/* Debug Section - Development Only */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="debug-section" style={{ background: '#f5f5f5', padding: '1rem', margin: '0 0 2rem 0', borderRadius: '8px', fontSize: '12px' }}>
                            <h4> Debug Info:</h4>
                            <p><strong>Total Products:</strong> {products.length}</p>
                            <p><strong>Categories:</strong> {Object.keys(groupedProducts).length}</p>
                        </div>
                    )}

                    {Object.keys(groupedProducts).length === 0 ? (
                        <div className="no-products">
                            <div className="no-products-icon">�</div>
                            <h3>No Products Found</h3>
                            <p>
                                {searchTerm
                                    ? 'Try adjusting your search query'
                                    : 'This shop doesn\'t have any products yet'
                                }
                            </p>
                            {searchTerm && (
                                <button onClick={clearSearch} className="clear-search-btn">
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grouped-products-container">
                            {Object.entries(groupedProducts).map(([category, items]) => (
                                <section
                                    key={category}
                                    id={category}
                                    className="menu-category-section"
                                    ref={el => categoryRefs.current[category] = el}
                                >
                                    <h2 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h2>

                                    <div className="modern-product-grid">
                                        {items.map(product => (
                                            <div key={product._id} className="modern-product-card">
                                                <div className="product-image-container">
                                                    {product.aiImage === 'none' && !imageIndexes[product._id] ? (
                                                        <div className="modern-product-placeholder"></div>
                                                    ) : (
                                                        <img
                                                            src={(imageIndexes[product._id] > 0)
                                                                ? ('https://tse2.mm.bing.net/th?q=' + getCleanImgQuery(product.name, imageIndexes[product._id]) + '&w=400&h=300&c=7&rs=1&p=0')
                                                                : (product.aiImage || ('https://tse2.mm.bing.net/th?q=' + getCleanImgQuery(product.name, 0) + '&w=400&h=300&c=7&rs=1&p=0'))}
                                                            alt={product.name}
                                                            className="modern-product-image"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    )}

                                                    {isAdmin && (
                                                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="admin-image-controls">
                                                            <button title="Cycle Through Images" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageIndexes(prev => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 })) }}>⟩</button>
                                                            <button title="Save This Image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveAiImage(product._id, 'https://tse2.mm.bing.net/th?q=' + getCleanImgQuery(product.name, imageIndexes[product._id] || 0) + '&w=400&h=300&c=7&rs=1&p=0') }}>&#x1F4BE;</button>
                                                            <button title="No Image" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm('Hide image for this product?')) saveAiImage(product._id, 'none') }}>&#x1F6AB;</button>
                                                            {product.aiImage && (
                                                                <button className="reset" title="Reset to AI Search" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm('Reset this product to dynamic AI images?')) saveAiImage(product._id, '') }}>↺</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="modern-product-info">
                                                    <div className="modern-product-text">
                                                        <h3 className="modern-product-name">{product.name || 'Unnamed Product'}</h3>
                                                        <div className="modern-product-price">
                                                            ₹{product.price?.toFixed(2) || '0.00'}
                                                        </div>
                                                        {product.description && (
                                                            <p className="modern-product-desc">
                                                                {product.description.length > 60
                                                                    ? product.description.substring(0, 60) + '...'
                                                                    : product.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleAddToCart(product)}
                                                        className={'modern-add-btn ' + (!product.inStock ? 'disabled' : '')}
                                                        disabled={!product.inStock}
                                                        aria-label="Add to cart"
                                                    >
                                                        {product.inStock ? '+' : 'Out'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="category-divider"></div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopPage;