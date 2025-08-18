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

            // Ensure product has shopId
            const productShopId = product.shopId?._id || product.shopId;
            if (!productShopId) {
                console.error('❌ Product missing shopId:', product);
                return false;
            }

            // Check if product is from a different shop
            if (selectedShop && selectedShop._id !== productShopId) {
                const confirmSwitch = window.confirm(
                    `You have items from ${selectedShop.name} in your cart. Adding items from ${product.shopId?.name || 'this shop'} will clear your current cart. Continue?`
                );

                if (!confirmSwitch) {
                    return false;
                }

                // Clear cart and switch shop
                setCartItems([]);
            }

            // Set or update selected shop
            if (!selectedShop || selectedShop._id !== productShopId) {
                const shopData = product.shopId && typeof product.shopId === 'object'
                    ? product.shopId
                    : { _id: productShopId, name: 'Unknown Shop' };
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

    const getCartTotal = () => {
        try {
            return cartItems.reduce((total, item) => {
                const price = parseFloat(item.discountedPrice || item.price || 0);
                const quantity = parseInt(item.quantity || 0);
                return total + (price * quantity);
            }, 0);
        } catch (error) {
            console.error('❌ Error calculating cart total:', error);
            return 0;
        }
    };

    const getCartSubtotal = () => {
        return getCartTotal();
    };

    const getDeliveryFee = () => {
        try {
            return parseFloat(selectedShop?.deliveryFee || 0);
        } catch (error) {
            console.error('❌ Error getting delivery fee:', error);
            return 0;
        }
    };

    const getServiceFee = () => {
        try {
            const subtotal = getCartSubtotal();
            return Math.round(subtotal * 0.05 * 100) / 100; // 5% service fee, rounded to 2 decimals
        } catch (error) {
            console.error('❌ Error calculating service fee:', error);
            return 0;
        }
    };

    const getTaxes = () => {
        try {
            const subtotal = getCartSubtotal();
            return Math.round(subtotal * 0.05 * 100) / 100; // 5% tax, rounded to 2 decimals
        } catch (error) {
            console.error('❌ Error calculating taxes:', error);
            return 0;
        }
    };

    const getGrandTotal = () => {
        try {
            const subtotal = getCartSubtotal();
            const deliveryFee = getDeliveryFee();
            const serviceFee = getServiceFee();
            const taxes = getTaxes();
            return Math.round((subtotal + deliveryFee + serviceFee + taxes) * 100) / 100;
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

    const isProductInCart = (productId) => {
        try {
            return cartItems.some(item => item._id === productId);
        } catch (error) {
            console.error('❌ Error checking if product in cart:', error);
            return false;
        }
    };

    const getProductQuantityInCart = (productId) => {
        try {
            const item = cartItems.find(item => item._id === productId);
            return item ? parseInt(item.quantity || 0) : 0;
        } catch (error) {
            console.error('❌ Error getting product quantity:', error);
            return 0;
        }
    };

    const canAddToCart = (product) => {
        try {
            // Check if product is available
            if (!product.isActive || !product.inStock) {
                return { canAdd: false, reason: 'Product is not available' };
            }

            // Check if adding to cart from different shop
            if (selectedShop && selectedShop._id !== (product.shopId?._id || product.shopId)) {
                return {
                    canAdd: true,
                    requiresConfirmation: true,
                    reason: `This will clear items from ${selectedShop.name}`
                };
            }

            return { canAdd: true };
        } catch (error) {
            console.error('❌ Error checking if can add to cart:', error);
            return { canAdd: false, reason: 'Error checking product availability' };
        }
    };

    const validateCart = () => {
        try {
            const errors = [];

            if (cartItems.length === 0) {
                errors.push('Cart is empty');
                return { isValid: false, errors };
            }

            if (!selectedShop) {
                errors.push('No shop selected');
                return { isValid: false, errors };
            }

            // Check minimum order value
            const subtotal = getCartSubtotal();
            if (selectedShop.minOrderValue && subtotal < selectedShop.minOrderValue) {
                errors.push(`Minimum order value is ₹${selectedShop.minOrderValue}`);
            }

            // Check maximum order value
            if (selectedShop.maxOrderValue && subtotal > selectedShop.maxOrderValue) {
                errors.push(`Maximum order value is ₹${selectedShop.maxOrderValue}`);
            }

            // Check product availability
            cartItems.forEach(item => {
                if (!item.isActive || !item.inStock) {
                    errors.push(`${item.name} is no longer available`);
                }

                if (item.stockQuantity && item.quantity > item.stockQuantity) {
                    errors.push(`Only ${item.stockQuantity} ${item.name} available`);
                }
            });

            return { isValid: errors.length === 0, errors };
        } catch (error) {
            console.error('❌ Error validating cart:', error);
            return { isValid: false, errors: ['Error validating cart'] };
        }
    };

    const getOrderSummary = () => {
        try {
            const subtotal = getCartSubtotal();
            const deliveryFee = getDeliveryFee();
            const serviceFee = getServiceFee();
            const taxes = getTaxes();
            const total = getGrandTotal();

            return {
                items: cartItems,
                itemCount: getCartItemsCount(),
                subtotal,
                deliveryFee,
                serviceFee,
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

    // Legacy support for existing components
    const cart = cartItems.map(item => ({
        product: item,
        shopId: selectedShop?._id,
        quantity: item.quantity
    }));

    const increaseQuantity = (productId) => {
        const currentQuantity = getProductQuantityInCart(productId);
        return updateQuantity(productId, currentQuantity + 1);
    };

    const decreaseQuantity = (productId) => {
        const currentQuantity = getProductQuantityInCart(productId);
        return updateQuantity(productId, Math.max(0, currentQuantity - 1));
    };

    const setCart = (newCart) => {
        try {
            const items = newCart.map(item => ({
                ...item.product,
                quantity: item.quantity,
                notes: item.notes || ''
            }));
            setCartItems(items);
            return true;
        } catch (error) {
            console.error('❌ Error setting cart:', error);
            return false;
        }
    };

    const value = {
        // New API
        cartItems,
        selectedShop,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNotes,
        clearCart,
        getCartTotal,
        getCartSubtotal,
        getDeliveryFee,
        getServiceFee,
        getTaxes,
        getGrandTotal,
        getCartItemsCount,
        isProductInCart,
        getProductQuantityInCart,
        canAddToCart,
        validateCart,
        getOrderSummary,

        // Legacy API for backward compatibility
        cart,
        increaseQuantity,
        decreaseQuantity,
        setCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };