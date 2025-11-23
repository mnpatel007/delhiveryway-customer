import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateDeliveryFee, getCurrentLocation, getCustomerLocation } from '../utils/deliveryCalculator';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('customerCart');
            const parsed = savedCart ? JSON.parse(savedCart) : [];
            console.log('📦 Cart restored from localStorage:', parsed.length, 'items');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('❌ Error loading cart from localStorage:', error);
            return [];
        }
    });

    const [selectedShop, setSelectedShop] = useState(() => {
        try {
            const savedShop = localStorage.getItem('selectedShop');
            const parsed = savedShop ? JSON.parse(savedShop) : null;
            console.log('🏪 Selected shop restored from localStorage:', parsed?.name || 'None');
            console.log('🏪 Full shop object from localStorage:', parsed);
            return parsed;
        } catch (error) {
            console.error('❌ Error loading selected shop from localStorage:', error);
            return null;
        }
    });

    const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(null);
    const [deliveryCalculationDetails, setDeliveryCalculationDetails] = useState(null);
    const [isCalculatingDeliveryFee, setIsCalculatingDeliveryFee] = useState(false);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('customerCart', JSON.stringify(cartItems));
            console.log('💾 Cart saved to localStorage:', cartItems.length, 'items');
        } catch (error) {
            console.error('❌ Error saving cart to localStorage:', error);
        }
    }, [cartItems]);

    // Save selected shop to localStorage whenever it changes
    useEffect(() => {
        try {
            if (selectedShop) {
                localStorage.setItem('selectedShop', JSON.stringify(selectedShop));
                console.log('💾 Selected shop saved:', selectedShop.name);
            } else {
                localStorage.removeItem('selectedShop');
                console.log('🗑️ Selected shop cleared');
            }
        } catch (error) {
            console.error('❌ Error saving selected shop to localStorage:', error);
        }
    }, [selectedShop]);

    // Calculate delivery fee when shop changes or on load
    useEffect(() => {
        if (selectedShop && selectedShop._id) {
            console.log('🚚 Shop changed, calculating delivery fee for:', selectedShop.name);
            calculateRealTimeDeliveryFee();
        } else {
            setCalculatedDeliveryFee(null);
        }
    }, [selectedShop]);

    // Ensure selected shop stays in sync with cart items on load
    useEffect(() => {
        try {
            if (!selectedShop && cartItems.length > 0) {
                const first = cartItems[0];
                let inferredShopId = null;
                if (typeof first.shopId === 'string') {
                    inferredShopId = first.shopId;
                } else if (first.shopId && first.shopId._id) {
                    inferredShopId = first.shopId._id;
                }
                if (inferredShopId) {
                    const inferredShop = {
                        _id: inferredShopId,
                        name: first.shopId?.name || 'Shop',
                        deliveryFee: first.shopId?.deliveryFee ?? 30
                    };
                    setSelectedShop(prev => prev || inferredShop);
                }
            }
        } catch (e) {
            console.error('❌ Error syncing selected shop from cart items:', e);
        }
    }, [selectedShop, cartItems]);

    const addToCart = (product, quantity = 1, notes = '') => {
        try {
            // Validate product data
            if (!product || !product._id) {
                console.error('❌ Invalid product data:', product);
                return false;
            }

            // Helper to normalize shopId values (string or populated object)
            const getShopId = (val) => {
                if (!val) return null;
                if (typeof val === 'string') return val;
                if (typeof val === 'object' && val._id) return val._id;
                return null;
            };

            const productShopId = getShopId(product.shopId);
            if (!productShopId) {
                console.error('❌ Could not extract shop ID from product:', product);
                return false;
            }

            // Determine current cart shop; if cart has items, prefer their shop over selectedShop
            let currentCartShopId = null;
            if (cartItems.length > 0) {
                currentCartShopId = getShopId(cartItems[0]?.shopId);
            } else {
                currentCartShopId = selectedShop?._id || null;
            }

            // Build consistent shop data for context
            let shopData;
            if (product.shopData) {
                shopData = product.shopData;
            } else if (product.shopId && typeof product.shopId === 'object') {
                shopData = {
                    ...product.shopId,
                    _id: productShopId,
                    name: product.shopId.name || 'Shop',
                    deliveryFee: product.shopId.deliveryFee ?? 30
                };
            } else {
                shopData = { _id: productShopId, name: 'Shop', deliveryFee: 30 };
            }

            const newItem = {
                ...product,
                quantity,
                notes,
                addedAt: new Date().toISOString()
            };

            // Same shop or empty cart => just add/update
            if (!currentCartShopId || String(currentCartShopId).trim() === String(productShopId).trim()) {
                setSelectedShop(shopData);
                setCartItems(prevItems => {
                    const existingItem = prevItems.find(item => item._id === product._id);
                    if (existingItem) {
                        console.log('📦 Updating existing item quantity:', product.name);
                        return prevItems.map(item =>
                            item._id === product._id
                                ? {
                                    ...item,
                                    quantity: (parseInt(item.quantity || 0) || 0) + (parseInt(quantity || 0) || 0),
                                    notes: notes || item.notes,
                                    updatedAt: new Date().toISOString()
                                }
                                : item
                        );
                    }
                    console.log('📦 Adding new item to cart:', product.name);
                    return [...prevItems, newItem];
                });
                return true;
            }

            // Different shop => clear and replace with new shop's item
            alert('Your cart had items from another shop. It has been reset for the new shop.');
            setSelectedShop(shopData);
            setCartItems([newItem]);
            return true;
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            return false;
        }
    };

    const removeFromCart = (productId) => {
        try {
            if (!productId) {
                console.error('❌ Invalid productId for removal');
                return false;
            }

            setCartItems(prevItems => {
                const newItems = prevItems.filter(item => item._id !== productId);
                console.log('🗑️ Item removed from cart. Remaining items:', newItems.length);

                // Clear selected shop if cart becomes empty
                if (newItems.length === 0) {
                    setSelectedShop(null); // Use original function internally
                }

                return newItems;
            });

            return true;
        } catch (error) {
            console.error('❌ Error removing from cart:', error);
            return false;
        }
    };

    const updateQuantity = (productId, quantity) => {
        try {
            if (!productId) {
                console.error('❌ Invalid productId for quantity update');
                return false;
            }

            if (quantity <= 0) {
                return removeFromCart(productId);
            }

            setCartItems(prevItems =>
                prevItems.map(item =>
                    item._id === productId
                        ? {
                            ...item,
                            quantity: Math.max(1, parseInt(quantity) || 1),
                            updatedAt: new Date().toISOString()
                        }
                        : item
                )
            );

            console.log('📦 Quantity updated for product:', productId, 'New quantity:', quantity);
            return true;
        } catch (error) {
            console.error('❌ Error updating quantity:', error);
            return false;
        }
    };

    const updateNotes = (productId, notes) => {
        try {
            if (!productId) {
                console.error('❌ Invalid productId for notes update');
                return false;
            }

            setCartItems(prevItems =>
                prevItems.map(item =>
                    item._id === productId
                        ? {
                            ...item,
                            notes: notes || '',
                            updatedAt: new Date().toISOString()
                        }
                        : item
                )
            );

            console.log('📝 Notes updated for product:', productId);
            return true;
        } catch (error) {
            console.error('❌ Error updating notes:', error);
            return false;
        }
    };

    const clearCart = () => {
        try {
            setCartItems([]);
            setSelectedShop(null); // Use original function internally
            localStorage.removeItem('customerCart');
            localStorage.removeItem('selectedShop');
            console.log('🗑️ Cart cleared completely');
            return true;
        } catch (error) {
            console.error('❌ Error clearing cart:', error);
            return false;
        }
    };

    const getCartSubtotal = () => {
        try {
            return cartItems.reduce((total, item) => {
                const price = parseFloat(item.price || 0);
                const quantity = parseInt(item.quantity || 0);
                return total + (price * quantity);
            }, 0);
        } catch (error) {
            console.error('❌ Error calculating cart subtotal:', error);
            return 0;
        }
    };

    // Calculate real-time delivery fee based on current location
    const calculateRealTimeDeliveryFee = async () => {
        if (!selectedShop || !selectedShop._id) {
            console.log('🚚 No selected shop for delivery fee calculation');
            return null;
        }

        setIsCalculatingDeliveryFee(true);

        try {
            // Get current location
            let location = await getCurrentLocation();

            if (!location) {
                // Fallback to saved location
                location = getCustomerLocation();
            }

            if (!location) {
                console.log('🚚 No location available for delivery fee calculation');
                setIsCalculatingDeliveryFee(false);
                return null;
            }

            console.log('🚚 Calculating delivery fee for shop:', selectedShop.name, 'with location:', location);

            // Calculate delivery fee using the API
            const subtotal = getCartSubtotal();
            const result = await calculateDeliveryFee(selectedShop._id, location, subtotal);

            console.log('🚚 Calculated delivery fee result:', result);
            setCalculatedDeliveryFee(result.deliveryFee);
            setDeliveryCalculationDetails({
                ...result.calculation,
                originalDeliveryFee: result.originalDeliveryFee,
                discountApplied: result.discountApplied
            });
            setIsCalculatingDeliveryFee(false);

            return result;

        } catch (error) {
            console.error('❌ Error calculating real-time delivery fee:', error);
            setIsCalculatingDeliveryFee(false);
            return null;
        }
    };

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const getDeliveryFee = () => {
        try {
            // Use calculated delivery fee if available
            if (calculatedDeliveryFee !== null) {
                console.log('🚚 Using calculated delivery fee:', calculatedDeliveryFee);
                return calculatedDeliveryFee;
            }

            console.log('🚚 Getting fallback delivery fee for shop:', selectedShop?.name);
            console.log('🚚 Shop delivery fee:', selectedShop?.deliveryFee);

            // Handle different shop data structures as fallback
            let deliveryFee;

            if (selectedShop.data && selectedShop.data.shop && selectedShop.data.shop.deliveryFee !== undefined) {
                // Structure: {success: true, data: {shop: {deliveryFee: 50, ...}}}
                deliveryFee = selectedShop.data.shop.deliveryFee;
                console.log('🚚 Using nested shop delivery fee:', deliveryFee);
            } else if (selectedShop && selectedShop.deliveryFee !== undefined) {
                // Structure: {deliveryFee: 50, ...}
                deliveryFee = selectedShop.deliveryFee;
                console.log('🚚 Using direct shop delivery fee:', deliveryFee);
            } else {
                // Default fee if shop delivery fee is not set
                console.log('🚚 Using default delivery fee: 30');
                return 30;
            }

            const fee = parseFloat(deliveryFee) || 0;
            console.log('🚚 Final fallback delivery fee:', fee);
            return fee;
        } catch (error) {
            console.error('❌ Error getting delivery fee:', error);
            return 30; // Default fee in case of error
        }
    };

    const getTaxes = () => {
        try {
            if (!selectedShop || !selectedShop.hasTax || !selectedShop.taxRate) {
                return 0;
            }

            const subtotal = getCartSubtotal();
            const taxAmount = Math.round((subtotal * selectedShop.taxRate) / 100);
            console.log('💰 Tax calculation:', {
                subtotal,
                taxRate: selectedShop.taxRate,
                taxAmount
            });
            return taxAmount;
        } catch (error) {
            console.error('❌ Error calculating taxes:', error);
            return 0;
        }
    };

    const getGrandTotal = () => {
        try {
            const subtotal = getCartSubtotal();
            const deliveryFee = getDeliveryFee();
            const taxes = getTaxes();
            // subtotal + delivery fee + taxes
            return Math.round((subtotal + deliveryFee + taxes) * 100) / 100;
        } catch (error) {
            console.error('❌ Error calculating grand total:', error);
            return 0;
        }
    };

    const getCartItemsCount = () => {
        try {
            return cartItems.reduce((total, item) => total + parseInt(item.quantity || 0), 0);
        } catch (error) {
            console.error('❌ Error counting cart items:', error);
            return 0;
        }
    };

    const getOrderSummary = () => {
        try {
            const subtotal = getCartSubtotal();
            const deliveryFee = getDeliveryFee();
            const taxes = getTaxes();
            const total = getGrandTotal();

            return {
                items: cartItems,
                itemCount: getCartItemsCount(),
                subtotal,
                deliveryFee,
                tax: taxes,  // Changed from 'taxes' to 'tax' for UI consistency
                total,
                shop: selectedShop
            };
        } catch (error) {
            console.error('❌ Error getting order summary:', error);
            return {
                items: [],
                itemCount: 0,
                subtotal: 0,
                deliveryFee: 0,
                serviceFee: 0,
                tax: 0,  // Changed from 'taxes' to 'tax'
                total: 0,
                shop: null
            };
        }
    };

    // Wrapper function to log shop updates
    const setSelectedShopWithLogging = (shopData) => {
        console.log('🏪 Setting selected shop:', shopData?.name || 'null', shopData);
        setSelectedShop(shopData);
    };

    // Debug function to check cart state
    const debugCartState = () => {
        console.log('🔍 CART DEBUG STATE:', {
            cartItemsCount: cartItems.length,
            selectedShopName: selectedShop?.name,
            selectedShopId: selectedShop?._id,
            cartItems: cartItems.map(item => ({
                name: item.name,
                shopId: item.shopId?._id || item.shopId,
                shopName: item.shopId?.name || 'Unknown'
            }))
        });
    };

    const value = {
        cartItems,
        selectedShop,
        setSelectedShop: setSelectedShopWithLogging,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNotes,
        clearCart,
        getCartSubtotal,
        getDeliveryFee,
        getTaxes,
        getGrandTotal,
        getCartItemsCount,
        getOrderSummary,
        debugCartState,
        calculatedDeliveryFee,
        deliveryCalculationDetails,
        isCalculatingDeliveryFee,
        calculateRealTimeDeliveryFee
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };