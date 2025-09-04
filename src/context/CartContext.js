import React, { createContext, useContext, useState, useEffect } from 'react';

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
            console.log('🏪 Selected shop restored:', parsed?.name || 'None');
            return parsed;
        } catch (error) {
            console.error('❌ Error loading selected shop from localStorage:', error);
            return null;
        }
    });

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

    const addToCart = (product, quantity = 1, notes = '') => {
        try {
            // Validate product data
            if (!product || !product._id) {
                console.error('❌ Invalid product data:', product);
                return false;
            }

            // Get shop ID from product
            const productShopId = product.shopId?._id || product.shopId;
            if (!productShopId) {
                console.error('❌ Product missing shopId:', product);
                return false;
            }

            console.log('🛒 Adding product to cart:', product.name);
            console.log('🛒 Product shop ID:', productShopId);
            console.log('🛒 Current selected shop:', selectedShop);
            console.log('🛒 Product shop data:', product.shopId);
            console.log('🛒 Product shop data type:', typeof product.shopId);
            console.log('🛒 Product shop data keys:', product.shopId ? Object.keys(product.shopId) : 'null');

            // Check if product is from a different shop
            // Only trigger cart clearing if we have valid shop IDs and they're actually different
            const hasValidShopData = selectedShop && selectedShop._id && productShopId;
            const isDifferentShop = hasValidShopData && selectedShop._id !== productShopId;

            console.log('🛒 Shop comparison:', {
                selectedShopId: selectedShop?._id,
                productShopId: productShopId,
                hasValidShopData: hasValidShopData,
                isDifferentShop: isDifferentShop
            });

            if (isDifferentShop) {
                const shopName = selectedShop.name || 'Unknown Shop';
                const confirmSwitch = window.confirm(
                    `You have items from ${shopName} in your cart. Adding items from a different shop will clear your current cart. Continue?`
                );

                if (!confirmSwitch) {
                    return false;
                }

                // Clear cart and switch shop
                setCartItems([]);
            }

            // Set or update selected shop
            const needsShopUpdate = !selectedShop || !selectedShop._id || selectedShop._id !== productShopId;
            console.log('🛒 Needs shop update:', needsShopUpdate);

            if (needsShopUpdate) {
                let shopData;
                if (product.shopId && typeof product.shopId === 'object') {
                    // Use the complete shop object from product
                    console.log('🛒 Product shop data before processing:', product.shopId);
                    console.log('🛒 Product shop deliveryFee:', product.shopId.deliveryFee);

                    shopData = {
                        ...product.shopId,
                        _id: product.shopId._id || productShopId,
                        name: product.shopId.name || 'Shop',
                        deliveryFee: product.shopId.deliveryFee !== undefined ? product.shopId.deliveryFee : 30 // Default to 30 if not set
                    };
                } else {
                    // Fallback if shop data is not complete
                    shopData = {
                        _id: productShopId,
                        name: 'Shop',
                        deliveryFee: 30 // Default delivery fee
                    };
                }
                console.log('🛒 Setting selected shop:', shopData);
                setSelectedShop(shopData);
            }

            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item._id === product._id);

                if (existingItem) {
                    console.log('📦 Updating existing item quantity:', product.name);
                    return prevItems.map(item =>
                        item._id === product._id
                            ? {
                                ...item,
                                quantity: item.quantity + quantity,
                                notes: notes || item.notes,
                                updatedAt: new Date().toISOString()
                            }
                            : item
                    );
                }

                console.log('📦 Adding new item to cart:', product.name);
                return [...prevItems, {
                    ...product,
                    quantity,
                    notes,
                    addedAt: new Date().toISOString()
                }];
            });

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
                    setSelectedShop(null);
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
            setSelectedShop(null);
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
            console.log('🚚 Getting delivery fee for shop:', selectedShop?.name);
            console.log('🚚 Shop delivery fee:', selectedShop?.deliveryFee);
            console.log('🚚 Shop delivery fee type:', typeof selectedShop?.deliveryFee);
            console.log('🚚 Full shop object:', selectedShop);

            // Use shop's fixed delivery fee set by admin
            if (selectedShop && selectedShop.deliveryFee !== undefined && selectedShop.deliveryFee !== null) {
                const fee = parseFloat(selectedShop.deliveryFee);
                console.log('🚚 Parsed delivery fee:', fee);
                // Return the fee even if it's 0 (free delivery)
                return isNaN(fee) ? 30 : fee;
            }

            // Default fee if shop delivery fee is not set
            console.log('🚚 Shop delivery fee not found, using default delivery fee: 30');
            return 30;
        } catch (error) {
            console.error('❌ Error getting delivery fee:', error);
            return 30; // Default fee in case of error
        }
    };

    const getTaxes = () => {
        // No taxes - removed as per requirements
        return 0;
    };

    const getGrandTotal = () => {
        try {
            const subtotal = getCartSubtotal();
            const deliveryFee = getDeliveryFee();
            // ONLY subtotal + delivery fee - NO TAXES, NO OTHER FEES
            return Math.round((subtotal + deliveryFee) * 100) / 100;
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
            const taxes = 0; // NO TAXES
            const total = getGrandTotal();

            return {
                items: cartItems,
                itemCount: getCartItemsCount(),
                subtotal,
                deliveryFee,
                taxes,
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
                taxes: 0,
                total: 0,
                shop: null
            };
        }
    };

    const value = {
        cartItems,
        selectedShop,
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
        getOrderSummary
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };