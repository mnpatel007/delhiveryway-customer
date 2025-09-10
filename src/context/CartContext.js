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
            console.log('🏪 Selected shop restored from localStorage:', parsed?.name || 'None');
            console.log('🏪 Full shop object from localStorage:', parsed);
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
            console.log('🚀 ADD TO CART CALLED:', {
                productName: product?.name,
                productId: product?._id,
                currentCartItems: cartItems.length,
                selectedShopName: selectedShop?.name,
                selectedShopId: selectedShop?._id
            });

            // Validate product data
            if (!product || !product._id) {
                console.error('❌ Invalid product data:', product);
                return false;
            }

            // Extract shop ID from product
            let productShopId = null;
            if (typeof product.shopId === 'string') {
                productShopId = product.shopId;
            } else if (product.shopId?._id) {
                productShopId = product.shopId._id;
            }

            console.log('🔍 Product shop ID extracted:', productShopId);
            console.log('🔍 Product shopId object:', product.shopId);
            console.log('🔍 Product shopId type:', typeof product.shopId);
            console.log('🔍 Product shopId keys:', product.shopId ? Object.keys(product.shopId) : 'null');

            if (!productShopId) {
                console.error('❌ Could not extract shop ID from product:', product);
                return false;
            }

            // Extract current shop ID from selected shop
            let currentShopId = null;
            if (selectedShop?._id) {
                currentShopId = selectedShop._id;
            }

            console.log('🔍 Current shop ID:', currentShopId);
            console.log('🔍 Selected shop object:', selectedShop);

            // Check if we're switching shops - be more strict about the comparison
            const isDifferentShop = selectedShop && currentShopId && productShopId &&
                String(currentShopId).trim() !== String(productShopId).trim();

            console.log('🛒 Shop comparison:', {
                currentShopId: currentShopId,
                productShopId: productShopId,
                currentShopName: selectedShop?.name,
                newShopName: product.shopId?.name,
                isDifferentShop: isDifferentShop,
                hasSelectedShop: !!selectedShop,
                cartItemsCount: cartItems.length,
                shopIdComparison: `${currentShopId} !== ${productShopId} = ${currentShopId !== productShopId}`
            });

            console.log('🛒 Detailed shop comparison:', {
                selectedShopExists: !!selectedShop,
                currentShopIdExists: !!currentShopId,
                productShopIdExists: !!productShopId,
                shopIdsEqual: currentShopId === productShopId,
                cartHasItems: cartItems.length > 0,
                shouldShowDialog: isDifferentShop && cartItems.length > 0
            });

            // Check if product is from a different shop and we have items in cart
            if (isDifferentShop && cartItems.length > 0) {
                console.log('🚨 DIFFERENT SHOP DETECTED! SHOULD SHOW CONFIRMATION DIALOG!');

                // Get shop names for the dialog
                const currentShopName = selectedShop?.name || 'Unknown Shop';
                const newShopName = product.shopId?.name || 'New Shop';

                console.log('🚨 Current shop:', currentShopName, 'New shop:', newShopName);

                // Show confirmation dialog
                const confirmMessage = `🛒 SHOP CHANGE REQUIRED\n\nYou have ${cartItems.length} items from "${currentShopName}" in your cart.\n\nAdding items from "${newShopName}" will clear your current cart.\n\nDo you want to continue?`;

                console.log('🚨 SHOWING CONFIRMATION DIALOG:', confirmMessage);
                const confirmSwitch = window.confirm(confirmMessage);

                if (!confirmSwitch) {
                    console.log('🛒 User cancelled shop switch');
                    return false;
                }

                console.log('🛒 User confirmed shop switch, clearing cart and switching shops...');

                // FORCE CLEAR THE CART IMMEDIATELY
                setCartItems([]);
                localStorage.removeItem('customerCart');

                // Clear selected shop temporarily
                setSelectedShop(null);
                localStorage.removeItem('selectedShop');

                // Show notification
                console.log(`✅ Cart cleared! Switching to "${newShopName}"`);

                // Add a small delay to ensure state is cleared
                setTimeout(() => {
                    console.log('🔄 Cart cleared, proceeding with new item...');
                }, 100);
            } else {
                console.log('🛒 Same shop or no existing shop, proceeding...', {
                    isDifferentShop,
                    cartItemsLength: cartItems.length,
                    reason: !isDifferentShop ? 'Same shop' : 'Empty cart'
                });
            }

            // Set or update selected shop
            if (!selectedShop || !currentShopId || String(currentShopId).trim() !== String(productShopId).trim()) {
                let shopData;
                if (product.shopId && typeof product.shopId === 'object') {
                    // Use the shop data from the product
                    shopData = {
                        ...product.shopId,
                        _id: productShopId,
                        name: product.shopId.name || 'Shop',
                        deliveryFee: product.shopId.deliveryFee || 30
                    };
                } else {
                    // Fallback shop data
                    shopData = {
                        _id: productShopId,
                        name: 'Shop',
                        deliveryFee: 30
                    };
                }
                console.log('🛒 Setting selected shop:', shopData);
                setSelectedShop(shopData);
            }

            // Check if we just cleared the cart due to shop switch
            if (isDifferentShop && cartItems.length > 0) {
                console.log('🔄 Shop switch detected, adding item to empty cart...');
                // Add the item to an empty cart
                setCartItems([{
                    ...product,
                    quantity,
                    notes,
                    addedAt: new Date().toISOString()
                }]);
            } else {
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
            }

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
            console.log('🚚 Full shop object:', selectedShop);

            // Handle different shop data structures
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
            console.log('🚚 Final delivery fee:', fee);
            return fee;
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
        debugCartState
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };