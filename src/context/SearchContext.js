import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Fuse from 'fuse.js';
import { productsAPI, apiCall } from '../services/api';

const SearchContext = createContext(null);

export const SearchProvider = ({ children }) => {
    const [indexLoaded, setIndexLoaded] = useState(false);
    const [indexError, setIndexError] = useState(null);
    const [productsIndex, setProductsIndex] = useState([]);
    const fuseRef = useRef(null);

    useEffect(() => {
        // Prefetch lightweight product index in background
        let cancelled = false;

        const loadIndex = async () => {
            try {
                const res = await apiCall(productsAPI.index, { limit: 20000 });
                if (!res.success) {
                    setIndexError(res.message || 'Failed to load product index');
                    return;
                }

                const items = res.data.data.products || [];
                if (cancelled) return;

                setProductsIndex(items);

                // build Fuse index
                fuseRef.current = new Fuse(items, {
                    keys: [
                        { name: 'name', weight: 0.7 },
                        { name: 'tags', weight: 0.2 },
                        { name: 'shopId.name', weight: 0.1 }
                    ],
                    includeScore: true,
                    threshold: 0.4,
                    ignoreLocation: true,
                    useExtendedSearch: true
                });

                setIndexLoaded(true);
            } catch (err) {
                console.error('Error loading product index', err);
                setIndexError(err.message || 'Failed to load index');
            }
        };

        loadIndex();

        return () => { cancelled = true; };
    }, []);

    const searchLocal = (query, limit = 500) => {
        if (!fuseRef.current || !query || query.trim().length < 1) return [];
        const results = fuseRef.current.search(query, { limit });
        return results.map(r => r.item);
    };

    const value = {
        indexLoaded,
        indexError,
        productsIndex,
        searchLocal
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => useContext(SearchContext);

export default SearchContext;
