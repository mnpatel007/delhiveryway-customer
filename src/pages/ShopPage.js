import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { shopsAPI, productsAPI, apiCall } from '../services/api';
import { CartContext } from '../context/CartContext';
import './ShopPage.css';

const ProductImage = ({ product, className, style }) => {
    // 1. Sanitize the name aggressively
    const baseName = product.name ? product.name.split('(')[0] : 'food';
    const cleanName = baseName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'indian food';

    // 2. Define URLs
    const originalUrl = (product.images && product.images.length > 0) ? product.images[0] : null;
    const specificAiUrl = `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(cleanName)}%20dish%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true`;
    // Backup generic URL that is almost guaranteed to work
    const genericAiUrl = `https://image.pollinations.ai/prompt/delicious%20indian%20food%20platter%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true`;

    // 3. State to track which level of the cascade we are on
    // Level 0: Original Image (if exists) -> otherwise start at Level 1
    // Level 1: Specific AI Image
    // Level 2: Generic AI Image
    // Level 3: Placeholder
    const [imageLevel, setImageLevel] = useState(originalUrl ? 0 : 1);

    // Reset when product ID changes
    useEffect(() => {
        setImageLevel(originalUrl ? 0 : 1);
    }, [product._id, originalUrl]);

    const handleError = () => {
        // Move to next level of fallback
        setImageLevel(prev => prev + 1);
    };

    // Render based on current level
    if (imageLevel === 0 && originalUrl) {
        return (
            <img
                src={originalUrl}
                alt={product.name}
                className={className}
                style={style}
                onError={handleError}
            />
        );
    }

    if (imageLevel <= 1) {
        return (
            <img
                src={specificAiUrl}
                alt={product.name}
                className={className}
                style={style}
                onError={handleError}
            />
        );
    }

    if (imageLevel === 2) {
        return (
            <img
                src={genericAiUrl}
                alt={product.name}
                className={className}
                style={style}
                onError={handleError}
            />
        );
    }

    // Level 3+ : Fallback Placeholder
    return (
        <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', minHeight: '100%' }}>
            <span style={{ fontSize: '24px' }}>🍽️</span>
        </div>
    );
};

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
    const { addToCart, setSelectedShop } = useContext(CartContext);
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

                if (shopResult.success && shopResult.data) {
                    let shopData = null;
                    const possiblePaths = [
                        shopResult.data.shop,
                        shopResult.data.data?.shop,
                        shopResult.data,
                        shopResult.data.data
                    ];

                    for (let i = 0; i < possiblePaths.length; i++) {
                        const candidate = possiblePaths[i];
                        if (candidate && candidate._id && candidate.name) {
                            shopData = candidate;
                            break;
                        }
                    }

                    if (!shopData) {
                        shopData = shopResult.data;
                    }

                    if (!shopData || !shopData._id || !shopData.name) {
                        setError('Invalid shop data received');
                        return;
                    }

                    setShop(shopData);
                } else {
                    setShop(null);
                    setError(shopResult.message || 'Failed to load shop details');
                    return;
                }

                // Fetch products
                const productResult = await apiCall(productsAPI.getByShop, id);
                let productsData = [];
                if (productResult.success && productResult.data) {
                    if (Array.isArray(productResult.data)) {
                        productsData = productResult.data;
                    } else if (productResult.data.products && Array.isArray(productResult.data.products)) {
                        productsData = productResult.data.products;
                    } else if (productResult.data.data && productResult.data.data.products && Array.isArray(productResult.data.data.products)) {
                        productsData = productResult.data.data.products;
                    } else if (productResult.data.data && Array.isArray(productResult.data.data)) {
                        productsData = productResult.data.data;
                    }
                }

                productsData = productsData.map(product => ({
                    ...product,
                    shopId: product.shopId || id,
                    inStock: product.inStock !== undefined ? product.inStock : true,
                    price: parseFloat(product.price || 0),
                    originalPrice: parseFloat(product.originalPrice || product.price || 0)
                }));

                setProducts(productsData);
                setFilteredProducts(productsData);

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
                const elementRect = element.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.scrollY;
                window.scrollTo({
                    top: absoluteElementTop - 100,
                    behavior: 'smooth'
                });

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

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchLower) ||
                product.description?.toLowerCase().includes(searchLower) ||
                product.category?.toLowerCase().includes(searchLower)
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product =>
                product.category?.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                default:
                    return 0;
            }
        });

        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory, sortBy]);

    // Update selected shop in cart context
    useEffect(() => {
        if (shop && shop._id && shop.name && shop.name !== 'Loading...') {
            setSelectedShop(shop);
        }
    }, [shop, setSelectedShop]);

    const getShopStatusMessage = (shop) => {
        if (!shop?.operatingHours) return { isOpen: true, message: 'Open' };
        const now = new Date();
        const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = dayNames[istTime.getDay()];
        const currentTime = istTime.toTimeString().slice(0, 5);
        const todayHours = shop.operatingHours[day];
        if (!todayHours || todayHours.closed) return { isOpen: false, message: 'Closed today' };
        if (!todayHours.open || !todayHours.close) return { isOpen: true, message: 'Open' };
        const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
        return { isOpen, message: isOpen ? `Open until ${todayHours.close}` : `Closed (Opens at ${todayHours.open})` };
    };

    const handleAddToCart = (product) => {
        try {
            if (!shop || !shop._id || !shop.name || shop.name === 'Loading...') {
                setToast('⏳ Please wait for shop data to load...');
                setTimeout(() => setToast(''), 3000);
                return;
            }
            const shopData = {
                ...shop,
                deliveryFee: shop.deliveryFee || 30,
                hasTax: shop.hasTax || false,
                taxRate: shop.taxRate || 5
            };
            const productWithShopData = {
                ...product,
                shopId: shop._id,
                shopData: shopData
            };
            const success = addToCart(productWithShopData, 1);
            if (success) {
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
            if (product.category) categories.add(product.category.toLowerCase());
        });
        return Array.from(categories);
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
                </div>
            </div>
        );
    }

    if (error || !shop) {
        return (
            <div className="modern-shop-container">
                <div className="error-state">
                    <div className="error-icon">🏪</div>
                    <h2>{error || 'Shop not found'}</h2>
                    <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-shop-container">
            {toast && (
                <div className="toast-notification">
                    <div className="toast-content">
                        <span className="toast-icon">✅</span>
                        <span className="toast-message">{toast}</span>
                    </div>
                </div>
            )}

            <div className="shop-hero">
                <div className="shop-hero-content">
                    <button onClick={() => navigate('/')} className="back-button">← Back to Shops</button>
                    <div className="shop-main-info">
                        <div className="shop-avatar">
                            <img
                                src={shop.images && shop.images.length > 0 ? shop.images[0] : `https://image.pollinations.ai/prompt/modern%20restaurant%20logo%20${encodeURIComponent(shop.name)}%20minimalist%20professional?width=200&height=200&nologo=true`}
                                alt={shop.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    if (!e.target.dataset.triedAi) {
                                        e.target.dataset.triedAi = 'true';
                                        e.target.src = `https://image.pollinations.ai/prompt/modern%20restaurant%20logo%20${encodeURIComponent(shop.name)}%20minimalist%20professional?width=200&height=200&nologo=true`;
                                    } else {
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = '<span class="shop-emoji">🏪</span>';
                                    }
                                }}
                            />
                        </div>
                        <div className="shop-details">
                            <h1 className="shop-name">{shop.name}</h1>
                            <p className="shop-description">{shop.description || 'Welcome to our shop!'}</p>
                            <div className="shop-meta">
                                <div className="meta-item">
                                    <span className="meta-icon">📦</span>
                                    <span className="meta-text">{products.length} products</span>
                                </div>
                                {(() => {
                                    const status = getShopStatusMessage(shop);
                                    return (
                                        <div className={`meta-item shop-status ${status.isOpen ? 'open' : 'closed'}`}>
                                            <span className="meta-icon">{status.isOpen ? '🟢' : '🔴'}</span>
                                            <span className="meta-text">{status.message}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showMenu && (
                <div className="menu-overlay" onClick={(e) => e.target.classList.contains('menu-overlay') && setShowMenu(false)}>
                    <div className="menu-panel">
                        <div className="menu-panel-header" style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 800 }}>{shop.name} Menu</div>
                            <button onClick={() => setShowMenu(false)} className="close-menu-btn">✕ Close</button>
                        </div>
                        <div className="menu-list">
                            {products.map((item) => (
                                <div key={item._id} className="menu-item" style={{ display: 'flex', padding: '12px', borderBottom: '1px solid #f0f0f0', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden' }}>
                                        <ProductImage product={item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                                        <div style={{ fontSize: '13px', color: '#666' }}>₹{item.price.toFixed(2)}</div>
                                    </div>
                                    <button onClick={() => handleAddToCart(item)} className="add-btn" disabled={!item.inStock}>Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="shop-controls">
                <div className="controls-content">
                    <div className="search-and-filters">
                        <div className="search-container">
                            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                            <span className="search-icon">🔍</span>
                        </div>
                        <div className="filters-container">
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="category-filter">
                                {getCategories().map(cat => (
                                    <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="view-controls">
                        <button onClick={() => setShowMenu(true)} className="view-menu-btn">📖 View Menu</button>
                        <button onClick={() => setViewMode('grid')} className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}>Grid</button>
                        <button onClick={() => setViewMode('list')} className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}>List</button>
                    </div>
                </div>
            </div>

            <div className="products-section">
                {filteredProducts.length === 0 ? (
                    <div className="no-products"><h3>No products found</h3></div>
                ) : (
                    <div className={`products-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                        {filteredProducts.map(product => (
                            <div key={product._id} className="product-card" ref={(el) => productRefsMap.current[product._id] = el}>
                                <div className="product-image-section">
                                    <ProductImage product={product} className="product-image" />
                                </div>
                                <div className="product-content">
                                    <h3 className="product-name">{product.name}</h3>
                                    {product.description && product.description !== '.' && (
                                        <p className="product-description">{product.description}</p>
                                    )}
                                    <div className="product-footer">
                                        <span className="product-price">₹{product.price.toFixed(2)}</span>
                                        <button onClick={() => handleAddToCart(product)} className="add-to-cart-btn" disabled={!product.inStock}>
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