import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { apiCall, shopsAPI, productsAPI } from '../../services/api';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const q = searchParams.get('q') || '';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);

    const { indexLoaded, searchLocal } = useSearch();

    useEffect(() => {
        if (!q || q.trim().length < 1) return;

        const doSearch = async () => {
            setLoading(true);
            setError(null);

            // If client index is ready, use local fuse search for instant results
            if (indexLoaded) {
                const local = searchLocal(q, 500);
                setProducts(local);
                setLoading(false);
                return;
            }

            // Fallback: call server-side search
            const res = await apiCall(productsAPI.search, { q, limit: 100 });
            if (!res.success) {
                setError(res.message || 'Failed to fetch search results');
                setLoading(false);
                return;
            }

            setProducts(res.data.data.products || []);
            setLoading(false);
        };

        doSearch();
    }, [q, indexLoaded]);

    // Group products by shop
    const shops = {};
    products.forEach(p => {
        const shop = p.shopId || {};
        const shopId = shop._id || (shop.id || 'unknown');
        if (!shops[shopId]) {
            shops[shopId] = { shopInfo: shop, products: [] };
        }
        shops[shopId].products.push(p);
    });

    const shopList = Object.values(shops);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Search results for "{q}"</h2>

            {loading && <p>Loading results…</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && q && shopList.length === 0 && (
                <p>No shops found with matching products.</p>
            )}

            {!loading && shopList.length > 0 && (
                <div>
                    <p>Found in {shopList.length} shop(s)</p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {shopList.map(({ shopInfo, products }) => (
                            <li key={shopInfo._id} style={{ border: '1px solid #eee', marginBottom: '12px', padding: '12px', borderRadius: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, cursor: 'pointer', color: '#007bff' }} onClick={() => navigate(`/shop/${shopInfo._id}`)}>{shopInfo.name || 'Shop'}</h3>
                                        <div style={{ color: '#666' }}>{products.length} matching product(s)</div>
                                    </div>
                                    <div>
                                        {products[0]?.images?.[0] && (
                                            <img src={products[0].images[0]} alt={products[0].name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {products.slice(0, 6).map(p => (
                                        <div key={p._id} style={{ border: '1px solid #f0f0f0', padding: '6px 8px', borderRadius: 4 }}>
                                            <strong>{p.name}</strong>
                                            <div style={{ color: '#666' }}>₹{p.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
