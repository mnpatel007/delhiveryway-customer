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

                // build Fuse index with stricter matching for better accuracy
                fuseRef.current = new Fuse(items, {
                    keys: [
                        { name: 'name', weight: 0.8 },      // Prioritize product name
                        { name: 'tags', weight: 0.15 },     // Tags less important
                        { name: 'shopId.name', weight: 0.05 } // Shop name least important
                    ],
                    includeScore: true,
                    threshold: 0.5,                  // Stricter threshold for closer matches only
                    minMatchCharLength: 2,           // Require at least 2 character match
                    ignoreLocation: true,
                    useExtendedSearch: true,
                    shouldSort: true                 // Sort by relevance score
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

        const q = query.trim().toLowerCase();
        const tokens = q.split(/\s+/).filter(Boolean);

        // Prefer strict substring matching on product name: every token must be present
        // Order results: prefix matches first, then other substring matches
        if (tokens.length > 0) {
            const prefixMatches = [];
            const containsMatches = [];

            for (const p of productsIndex) {
                const name = (p.name || '').toLowerCase();
                if (!name) continue;
                const allTokensPresent = tokens.every(tok => name.includes(tok));
                if (!allTokensPresent) continue;
                // If the name starts with the full query or first token, prefer it
                if (name.startsWith(q) || name.startsWith(tokens[0])) {
                    prefixMatches.push(p);
                } else {
                    containsMatches.push(p);
                }
            }

            const combined = [...prefixMatches, ...containsMatches];
            if (combined.length > 0) {
                console.log(`🔎 Direct substring match for "${query}": ${combined.length} results (prefix ${prefixMatches.length}, contains ${containsMatches.length})`);
                return combined.slice(0, limit);
            }
        }

        // Fallback to Fuse fuzzy search when strict substring doesn't return results
        const results = fuseRef.current.search(query, { limit });
        // Log search results with relevance scores for debugging
        if (results.length > 0) {
            console.log(`🔍 Fuzzy search "${query}": ${results.length} results`, 
                results.slice(0, 3).map(r => ({ 
                    name: r.item.name, 
                    score: (r.score || 0).toFixed(3),
                    shop: r.item.shopId?.name 
                }))
            );
        }
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
