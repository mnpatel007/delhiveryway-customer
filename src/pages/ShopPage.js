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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                setLoading(true);
                const [shopResult, productResult] = await Promise.all([
                    apiCall(shopsAPI.getById, id),
                    apiCall(productsAPI.getByShop, id)
                ]);

                if (shopResult.success) {
                    setShop(shopResult.data);
                } else {
                    console.error('Failed to fetch shop:', shopResult.message);
                }

                let productsData = [];
                
                if (productResult.success && productResult.data) {
                    productsData = productResult.data.products || [];
                } else {
                    console.warn('⚠️ Failed to fetch products:', productResult.message);
                    productsData = [];
                }

                setProducts(productsData);
                setFilteredProducts(productsData);
            } catch (err) {
                console.error('Error fetching shop or products:', err);
                setProducts([]);
                setFilteredProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchShopAndProducts();
    }, [id]);

    // Filter and sort products
    useEffect(() => {
        console.log('🔄 Filtering products:', products, 'Length:', products?.length);

        if (!Array.isArray(products)) {
            console.warn('⚠️ Products is not an array:', products);
            setFilteredProducts([]);
            return;
        }

        let filtered = products;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                default:
                    return 0;
            }
        });

        console.log('✅ Filtered products result:', filtered, 'Length:', filtered.length);
        setFilteredProducts(filtered);
    }, [products, searchTerm, selectedCategory, sortBy]);

    const handleAddToCart = (product) => {
        const success = addToCart(product, 1); // quantity = 1, not the shop id
        if (success) {
            setToast(`${product.name} added to cart`);
            setTimeout(() => setToast(''), 3000);
        } else {
            setToast('Failed to add to cart');
            setTimeout(() => setToast(''), 3000);
        }
    };

    const getCategories = () => {
        if (!Array.isArray(products)) {
            return ['all'];
        }
        const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
        return categories;
    };

    const handleBackToShops = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="modern-shop-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Discovering amazing products...</p>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="modern-shop-container">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h2>Shop Not Found</h2>
                    <p>The shop you're looking for doesn't exist or has been removed.</p>
                    <button onClick={handleBackToShops} className="back-btn">
                        ← Back to Shops
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
                        <span className="toast-icon">✨</span>
                        <span className="toast-message">{toast}</span>
                    </div>
                </div>
            )}

            {/* Shop Hero Section */}
            <section className="shop-hero">
                <div className="shop-hero-content">
                    <div className="shop-hero-info">
                        <button onClick={handleBackToShops} className="back-button">
                            <span className="back-arrow">←</span>
                            <span>Back to Shops</span>
                        </button>

                        <div className="shop-main-info">
                            <div className="shop-avatar">
                                {shop.images && shop.images.length > 0 ? (
                                    <img src={shop.images[0]} alt={shop.name} />
                                ) : (
                                    <span className="shop-emoji">🏪</span>
                                )}
                            </div>

                            <div className="shop-details">
                                <h1 className="shop-name">{shop.name}</h1>
                                <p className="shop-description">{shop.description}</p>

                                <div className="shop-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">📍</span>
                                        <span className="meta-text">
                                            {shop.address ? (typeof shop.address === 'object' ?
                                                `${shop.address.street}, ${shop.address.city}, ${shop.address.state}` :
                                                shop.address) : 'Location not available'}
                                        </span>
                                    </div>

                                    {shop.rating && (
                                        <div className="meta-item">
                                            <span className="meta-icon">⭐</span>
                                            <span className="meta-text">
                                                {shop.rating.average?.toFixed(1) || '4.0'}
                                                ({shop.rating.count || 0} reviews)
                                            </span>
                                        </div>
                                    )}

                                    <div className="meta-item">
                                        <span className="meta-icon">📦</span>
                                        <span className="meta-text">
                                            {products.length} products available
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Controls Section */}
            <section className="shop-controls">
                <div className="controls-content">
                    <div className="search-and-filters">
                        <div className="search-container">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
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
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                    </div>

                    <div className="view-controls">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        >
                            <span className="view-icon">⊞</span>
                            <span>Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            <span className="view-icon">☰</span>
                            <span>List</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="products-section">
                <div className="products-header">
                    <h2 className="products-title">
                        {searchTerm ? `Search Results for "${searchTerm}"` : 'Our Products'}
                    </h2>
                    <span className="products-count">
                        {filteredProducts.length} of {products.length} products
                    </span>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="no-products">
                        <div className="no-products-icon">📦</div>
                        <h3>No products found</h3>
                        <p>
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'This shop doesn\'t have any products yet'
                            }
                        </p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="clear-search-btn"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`products-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                        {filteredProducts.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-image-section">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="product-image"
                                            onError={(e) => {
                                                e.target.src = '/placeholder-product.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="product-placeholder">
                                            <span className="product-icon">📦</span>
                                        </div>
                                    )}

                                    {product.category && (
                                        <div className="product-category-badge">
                                            {product.category}
                                        </div>
                                    )}
                                </div>

                                <div className="product-content">
                                    <div className="product-header">
                                        <h3 className="product-name">{product.name}</h3>
                                        {product.description && (
                                            <p className="product-description">
                                                {product.description.length > 100
                                                    ? `${product.description.substring(0, 100)}...`
                                                    : product.description
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="product-footer">
                                        <div className="product-price-section">
                                            <span className="product-price">₹{product.price.toFixed(2)}</span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>
                                            )}
                                        </div>

                                        <button
                                            className="add-to-cart-btn"
                                            onClick={() => handleAddToCart(product)}
                                        >
                                            <span className="cart-icon">🛒</span>
                                            <span>Add to Cart</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ShopPage;