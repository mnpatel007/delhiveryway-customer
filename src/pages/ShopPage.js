import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { shopsAPI, productsAPI, apiCall } from '../services/api';
import { CartContext } from '../context/CartContext';
import './ShopPage.css';

const ProductImage = ({ product, className, style }) => {
    // 1. Sanitize the name aggressively
    const baseName = product.name ? product.name.split('(')[0] : 'food';
    const cleanName = baseName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'indian food';

    // 2. Deterministic URLs
    const originalUrl = (product.images && product.images.length > 0) ? product.images[0] : null;

    // We use useMemo to ensure these strings are stable across renders unless product changes
    const specificAiUrl = useMemo(() =>
        `https://image.pollinations.ai/prompt/delicious%20indian%20food%20${encodeURIComponent(cleanName)}%20professional%20food%20photography%20white%20background?width=400&height=320&nologo=true&seed=${product._id?.slice(-5) || '1'}`,
        [cleanName, product._id]
    );

    const genericAiUrl = useMemo(() =>
        `https://image.pollinations.ai/prompt/delicious%20indian%20food%20platter%20professional%20food%20photography%20white%20background?width=400&height=320&nologo=true&seed=999`,
        []
    );

    // Level 0: Original | Level 1: Specific AI | Level 2: Generic AI | Level 3: Placeholder
    const [level, setLevel] = useState(originalUrl ? 0 : 1);

    useEffect(() => {
        setLevel(originalUrl ? 0 : 1);
    }, [product._id, originalUrl]);

    const handleError = () => {
        console.log(`Image failed at level ${level} for ${product.name}, moving to ${level + 1}`);
        setLevel(prev => prev + 1);
    };

    // Determine current source
    let currentSrc = null;
    if (level === 0) currentSrc = originalUrl;
    else if (level === 1) currentSrc = specificAiUrl;
    else if (level === 2) currentSrc = genericAiUrl;

    if (level >= 3 || !currentSrc) {
        return (
            <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-secondary)', minHeight: '100px' }}>
                <span style={{ fontSize: '24px' }}>🍽️</span>
            </div>
        );
    }

    return (
        <img
            key={`${product._id}-${level}`} // Unique key forces a hard DOM refresh per level
            src={currentSrc}
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid');
    const [showMenu, setShowMenu] = useState(false);
    const [toast, setToast] = useState('');

    const { addToCart, setSelectedShop } = useContext(CartContext);
    const productRefsMap = useRef({});

    // 1. Unified Fetching (Flicker Protected)
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                if (isMounted) {
                    setLoading(true);
                    setError('');
                }

                const [shopRes, prodRes] = await Promise.all([
                    apiCall(shopsAPI.getById, id),
                    apiCall(productsAPI.getByShop, id)
                ]);

                if (!isMounted) return;

                if (shopRes.success) {
                    const sData = shopRes.data?.shop || shopRes.data?.data?.shop || shopRes.data;
                    setShop(sData);
                    // Update context ONCE
                    setSelectedShop(sData);
                } else {
                    setError('Shop not found');
                }

                if (prodRes.success) {
                    let pList = prodRes.data?.products || prodRes.data?.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
                    setProducts(pList.map(p => ({
                        ...p,
                        price: parseFloat(p.price || 0),
                        inStock: p.inStock !== false
                    })));
                }

            } catch (err) {
                if (isMounted) setError('Failed to load shop data');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (id) fetchData();
        return () => { isMounted = false; };
    }, [id]); // DO NOT add setSelectedShop here, it causes the flicker loop

    // 2. Filtering & Sorting
    useEffect(() => {
        let result = [...products];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p => p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term));
        }

        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
        }

        result.sort((a, b) => {
            if (sortBy === 'price') return a.price - b.price;
            if (sortBy === 'price-desc') return b.price - a.price;
            return (a.name || '').localeCompare(b.name || '');
        });

        setFilteredProducts(result);
    }, [products, searchTerm, selectedCategory, sortBy]);

    // 3. Highlight Logic
    useEffect(() => {
        const highlight = searchParams.get('highlight');
        if (highlight && productRefsMap.current[highlight]) {
            setTimeout(() => {
                productRefsMap.current[highlight].scrollIntoView({ behavior: 'smooth', block: 'center' });
                productRefsMap.current[highlight].classList.add('highlighted');
                setTimeout(() => productRefsMap.current[highlight].classList.remove('highlighted'), 3000);
            }, 500);
        }
    }, [filteredProducts, searchParams]);

    const handleAddToCart = (product) => {
        const success = addToCart({ ...product, shopId: id, shopData: shop }, 1);
        if (success) {
            setToast(`Added ${product.name}`);
            setTimeout(() => setToast(''), 3000);
        }
    };

    if (loading) return <div className="modern-shop-container"><div className="loading-state"><div className="loading-spinner"></div><h3>Loading Shop...</h3></div></div>;
    if (error || !shop) return <div className="modern-shop-container"><div className="error-state"><h2>{error || 'Shop not found'}</h2><button onClick={() => navigate('/')}>Back Home</button></div></div>;

    const categories = ['all', ...new Set(products.map(p => p.category?.toLowerCase()).filter(Boolean))];

    return (
        <div className="modern-shop-container">
            {toast && <div className="toast-notification">{toast}</div>}

            <div className="shop-hero">
                <div className="shop-hero-content">
                    <button onClick={() => navigate('/')} className="back-button">← Back</button>
                    <div className="shop-main-info">
                        <div className="shop-avatar">
                            <img src={shop.images?.[0] || 'https://via.placeholder.com/150'} alt={shop.name} onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
                        </div>
                        <div className="shop-details">
                            <h1 className="shop-name">{shop.name}</h1>
                            <p className="shop-description">{shop.description}</p>
                            <div className="shop-meta">
                                <span>📦 {products.length} Products</span>
                                <span className="shop-status-badge">Open</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="shop-controls">
                <div className="controls-content">
                    <div className="search-group">
                        <input type="text" placeholder="Search menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Items' : c}</option>)}
                        </select>
                    </div>
                    <div className="view-group">
                        <button className="view-menu-btn" onClick={() => setShowMenu(true)}>📖 Menu</button>
                        <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Grid</button>
                        <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
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
                                {product.description && <p className="product-description">{product.description}</p>}
                                <div className="product-footer">
                                    <span className="product-price">₹{product.price.toFixed(2)}</span>
                                    <button className="add-to-cart-btn" onClick={() => handleAddToCart(product)} disabled={!product.inStock}>
                                        {product.inStock ? 'Add to Cart' : 'Sold Out'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showMenu && (
                <div className="menu-overlay" onClick={() => setShowMenu(false)}>
                    <div className="menu-panel" onClick={e => e.stopPropagation()}>
                        <div className="menu-header">
                            <h2>Full Menu</h2>
                            <button onClick={() => setShowMenu(false)}>✕</button>
                        </div>
                        <div className="menu-items">
                            {products.map(p => (
                                <div key={p._id} className="menu-row">
                                    <div className="menu-row-img">
                                        <ProductImage product={p} />
                                    </div>
                                    <div className="menu-row-info">
                                        <strong>{p.name}</strong>
                                        <span>₹{p.price.toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => handleAddToCart(p)}>Add</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopPage;