import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { shopsAPI, productsAPI, apiCall } from '../services/api';
import { CartContext } from '../context/CartContext';
import './ShopPage.css';

const ProductImage = ({ product, className, style }) => {
    const baseName = product.name ? product.name.split('(')[0] : 'food';
    const cleanName = baseName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'indian food';

    // Create deterministic seeds to avoid flickering but ensure uniqueness
    const seed = product._id ? product._id.slice(-6) : '42';

    const originalUrl = (product.images && product.images.length > 0) ? product.images[0] : null;
    const aiUrl = `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(cleanName)}%20dish%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true&seed=${seed}`;
    const backupUrl = `https://image.pollinations.ai/prompt/delicious%20indian%20food%20platter%20professional%20food%20photography%20isolated%20white%20background%20high%20quality?width=400&height=320&nologo=true&seed=999`;

    const [src, setSrc] = useState(originalUrl || aiUrl);
    const [hasFinalError, setHasFinalError] = useState(false);

    useEffect(() => {
        setSrc(originalUrl || aiUrl);
        setHasFinalError(false);
    }, [product._id, originalUrl, aiUrl]);

    const handleError = () => {
        if (src === originalUrl) {
            setSrc(aiUrl);
        } else if (src === aiUrl) {
            setSrc(backupUrl);
        } else {
            setHasFinalError(true);
        }
    };

    if (hasFinalError) {
        return (
            <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', minHeight: '100%' }}>
                <span style={{ fontSize: '24px' }}>🍽️</span>
            </div>
        );
    }

    return (
        <img
            key={src}
            src={src}
            alt={product.name}
            className={className}
            style={style}
            onError={handleError}
        />
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

                const shopResult = await apiCall(shopsAPI.getById, id);

                if (shopResult.success && shopResult.data) {
                    let shopData = null;
                    const possiblePaths = [
                        shopResult.data.shop,
                        shopResult.data.data?.shop,
                        shopResult.data,
                        shopResult.data.data
                    ];

                    for (let candidate of possiblePaths) {
                        if (candidate && candidate._id && candidate.name) {
                            shopData = candidate;
                            break;
                        }
                    }

                    if (!shopData) shopData = shopResult.data;
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

                const productResult = await apiCall(productsAPI.getByShop, id);
                let productsData = [];
                if (productResult.success && productResult.data) {
                    if (Array.isArray(productResult.data)) {
                        productsData = productResult.data;
                    } else if (productResult.data.products) {
                        productsData = productResult.data.products;
                    } else if (productResult.data.data?.products) {
                        productsData = productResult.data.data.products;
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
                setError('Failed to load data.');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchShopAndProducts();
        }
    }, [id]);

    useEffect(() => {
        const highlightId = searchParams.get('highlight');
        if (highlightId && filteredProducts.length > 0 && productRefsMap.current[highlightId]) {
            const element = productRefsMap.current[highlightId];
            if (element) {
                const absoluteElementTop = element.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: absoluteElementTop - 100, behavior: 'smooth' });
                element.classList.add('highlighted');
                setTimeout(() => element.classList.remove('highlighted'), 2000);
            }
        }
    }, [filteredProducts, searchParams]);

    useEffect(() => {
        if (!Array.isArray(products)) return;
        let filtered = [...products];

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower)
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
        }

        filtered.sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            return (a.name || '').localeCompare(b.name || '');
        });

        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory, sortBy]);

    useEffect(() => {
        if (shop && shop._id && shop.name && shop.name !== 'Loading...') {
            setSelectedShop(shop);
        }
    }, [shop, setSelectedShop]);

    const getShopStatusMessage = (shop) => {
        if (!shop?.operatingHours) return { isOpen: true, message: 'Open' };
        const istTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][istTime.getDay()];
        const currentTime = istTime.toTimeString().slice(0, 5);
        const hours = shop.operatingHours[day];
        if (!hours || hours.closed) return { isOpen: false, message: 'Closed today' };
        if (!hours.open || !hours.close) return { isOpen: true, message: 'Open' };
        const isOpen = currentTime >= hours.open && currentTime <= hours.close;
        return { isOpen, message: isOpen ? `Open until ${hours.close}` : `Closed (Opens at ${hours.open})` };
    };

    const handleAddToCart = (product) => {
        try {
            if (!shop?._id) return;
            const success = addToCart({ ...product, shopId: shop._id, shopData: shop }, 1);
            if (success) {
                setSelectedShop(shop);
                setToast(`✅ ${product.name} added to cart`);
            }
        } catch (error) {
            setToast('❌ Error adding to cart');
        }
        setTimeout(() => setToast(''), 3000);
    };

    const getCategories = () => {
        const categories = new Set(['all']);
        products.forEach(p => p.category && categories.add(p.category.toLowerCase()));
        return Array.from(categories);
    };

    if (loading) return <div className="modern-shop-container"><div className="loading-state"><h3>Loading...</h3></div></div>;
    if (error || !shop) return <div className="modern-shop-container"><div className="error-state"><h2>{error || 'Not found'}</h2></div></div>;

    return (
        <div className="modern-shop-container">
            {toast && <div className="toast-notification"><div className="toast-content"><span>{toast}</span></div></div>}

            <div className="shop-hero">
                <div className="shop-hero-content">
                    <button onClick={() => navigate('/')} className="back-button">← Back</button>
                    <div className="shop-main-info">
                        <div className="shop-avatar">
                            <img
                                src={shop.images?.[0] || `https://image.pollinations.ai/prompt/restaurant%20logo%20${encodeURIComponent(shop.name)}?width=200&height=200`}
                                alt={shop.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="shop-details">
                            <h1 className="shop-name">{shop.name}</h1>
                            <p className="shop-description">{shop.description}</p>
                            <div className="shop-meta">
                                <div className="meta-item">📦 {products.length} products</div>
                                <div className={`meta-item ${getShopStatusMessage(shop).isOpen ? 'open' : 'closed'}`}>
                                    {getShopStatusMessage(shop).message}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showMenu && (
                <div className="menu-overlay" onClick={(e) => e.target.classList.contains('menu-overlay') && setShowMenu(false)}>
                    <div className="menu-panel">
                        <div className="menu-panel-header">
                            <h3>Menu</h3>
                            <button onClick={() => setShowMenu(false)}>✕</button>
                        </div>
                        <div className="menu-list">
                            {products.map(item => (
                                <div key={item._id} className="menu-item">
                                    <div style={{ width: 48, height: 48, borderRadius: 4, overflow: 'hidden' }}>
                                        <ProductImage product={item} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>{item.name} <small>₹{item.price.toFixed(2)}</small></div>
                                    <button onClick={() => handleAddToCart(item)} disabled={!item.inStock}>Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="shop-controls">
                <div className="controls-content">
                    <div className="search-and-filters">
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            {getCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="view-controls">
                        <button onClick={() => setShowMenu(true)}>📖 Menu</button>
                        <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>Grid</button>
                        <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>List</button>
                    </div>
                </div>
            </div>

            <div className="products-section">
                <div className={`products-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
                    {filteredProducts.map(product => (
                        <div key={product._id} className="product-card" ref={el => productRefsMap.current[product._id] = el}>
                            <div className="product-image-section">
                                <ProductImage product={product} className="product-image" />
                            </div>
                            <div className="product-content">
                                <h3 className="product-name">{product.name}</h3>
                                {product.description && product.description !== '.' && <p className="product-description">{product.description}</p>}
                                <div className="product-footer">
                                    <span className="product-price">₹{product.price.toFixed(2)}</span>
                                    <button onClick={() => handleAddToCart(product)} className="add-to-cart-btn" disabled={!product.inStock}>
                                        {product.inStock ? 'Add to Cart' : 'Out'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShopPage;