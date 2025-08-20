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
    const [viewMode, setViewMode] = useState('grid');
    const { addToCart } = useContext(CartContext);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            try {
                setLoading(true);

                // Fetch shop details
                const shopResult = await apiCall(shopsAPI.getById, id);
                if (shopResult.success) {
                    setShop(shopResult.data);
                } else {
                    console.error('Failed to fetch shop:', shopResult.message);
                    setShop(null);
                    return;
                }

                // Fetch products
                const productResult = await apiCall(productsAPI.getByShop, id);

                let productsData = [];
                if (productResult.success && productResult.data) {
                    // Handle different response formats
                    if (Array.isArray(productResult.data)) {
                        productsData = productResult.data;
                    } else if (productResult.data.products && Array.isArray(productResult.data.products)) {
                        productsData = productResult.data.products;
                    } else if (productResult.data.data && Array.isArray(productResult.data.data)) {
                        productsData = productResult.data.data;
                    }
                }

                console.log('📦 Products loaded:', productsData.length);
                setProducts(productsData);
                setFilteredProducts(productsData);

            } catch (err) {
                console.error('Error fetching data:', err);
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

    const handleAddToCart = (product) => {
        try {
            const success = addToCart(product, 1);
            if (success) {
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
            <div className="shop-page-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <h3>Loading Shop...</h3>
                    <p>Please wait while we fetch the latest products</p>
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="shop-page-container">
                <div className="error-state">
                    <div className="error-icon">🏪</div>
                    <h2>Shop Not Found</h2>
                    <p>The shop you're looking for doesn't exist or may have been removed.</p>
                    <button onClick={handleBackToShops} className="btn btn-primary">
                        ← Back to Shops
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="shop-page-container">
            {/* Toast Notification */}
            {toast && (
                <div className="toast-notification">
                    <div className="toast-content">
                        <span>{toast}</span>
                    </div>
                </div>
            )}

            {/* Shop Header */}
            <div className="shop-header">
                <div className="shop-header-content">
                    <button onClick={handleBackToShops} className="back-button">
                        <span>←</span> Back to Shops
                    </button>

                    <div className="shop-info">
                        <div className="shop-avatar">
                            {shop.images && shop.images.length > 0 ? (
                                <img src={shop.images[0]} alt={shop.name} />
                            ) : (
                                <span className="shop-emoji">🏪</span>
                            )}
                        </div>

                        <div className="shop-details">
                            <h1 className="shop-name">{shop.name}</h1>
                            <p className="shop-description">{shop.description || 'Welcome to our shop!'}</p>

                            <div className="shop-meta">
                                {shop.rating && (
                                    <div className="meta-item">
                                        <span>⭐ {shop.rating.average?.toFixed(1) || '4.0'}</span>
                                        <span>({shop.rating.count || 0} reviews)</span>
                                    </div>
                                )}

                                <div className="meta-item">
                                    <span>📦 {products.length} products</span>
                                </div>

                                {shop.deliveryFee !== undefined && (
                                    <div className="meta-item">
                                        <span>🚚 {shop.deliveryFee === 0 ? 'Free delivery' : `₹${shop.deliveryFee} delivery`}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="shop-controls">
                <div className="controls-content">
                    <div className="search-section">
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

                        {(searchTerm || selectedCategory !== 'all') && (
                            <button onClick={clearSearch} className="clear-filters-btn">
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <div className="filters-section">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="filter-select"
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
                            className="filter-select"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                        </select>

                        <div className="view-toggle">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            >
                                ⊞
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="products-section">
                <div className="products-header">
                    <h2>
                        {searchTerm ? `Search Results for "${searchTerm}"` : 'Our Products'}
                    </h2>
                    <span className="products-count">
                        {filteredProducts.length} of {products.length} products
                    </span>
                </div>

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
                            <button onClick={clearSearch} className="btn btn-primary">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`products-grid ${viewMode}`}>
                        {filteredProducts.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-image">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="product-placeholder" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                                        <span className="product-icon">📦</span>
                                    </div>

                                    {product.category && (
                                        <div className="category-badge">
                                            {product.category}
                                        </div>
                                    )}
                                </div>

                                <div className="product-info">
                                    <h3 className="product-name">{product.name}</h3>

                                    {product.description && (
                                        <p className="product-description">
                                            {product.description.length > 80
                                                ? `${product.description.substring(0, 80)}...`
                                                : product.description
                                            }
                                        </p>
                                    )}

                                    <div className="product-footer">
                                        <div className="price-section">
                                            <span className="current-price">₹{(product.price || 0).toFixed(2)}</span>
                                            {product.originalPrice && product.originalPrice > product.price && (
                                                <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="add-to-cart-btn"
                                            disabled={!product.inStock}
                                        >
                                            {product.inStock ? (
                                                <>
                                                    <span>🛒</span>
                                                    Add to Cart
                                                </>
                                            ) : (
                                                <>
                                                    <span>❌</span>
                                                    Out of Stock
                                                </>
                                            )}
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