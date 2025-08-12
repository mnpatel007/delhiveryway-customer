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
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return [];
        }
    });

    const [selectedShop, setSelectedShop] = useState(() => {
        try {
            const savedShop = localStorage.getItem('selectedShop');
            return savedShop ? JSON.parse(savedShop) : null;
        } catch (error) {
            console.error('Error loading selected shop from localStorage:', error);
            return null;
        }
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('customerCart', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [cartItems]);

    // Save selected shop to localStorage whenever it changes
    useEffect(() => {
        try {
            if (selectedShop) {
                localStorage.setItem('selectedShop', JSON.stringify(selectedShop));
            } else {
                localStorage.removeItem('selectedShop');
            }
        } catch (error) {
            console.error('Error saving selected shop to localStorage:', error);
        }
    }, [selectedShop]);

    const addToCart = (product, quantity = 1, notes = '') => {
        // Check if product is from a different shop
        if (selectedShop && selectedShop._id !== product.shopId._id) {
            const confirmSwitch = window.confirm(
                `You have items from ${selectedShop.name} in your cart. Adding items from ${product.shopId.name} will clear your current cart. Continue?`
            );

            if (!confirmSwitch) {
                return false;
            }

            // Clear cart and switch shop
            setCartItems([]);
        }

        // Set or update selected shop
        if (!selectedShop || selectedShop._id !== product.shopId._id) {
            setSelectedShop(product.shopId);
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item._id === product._id);

            if (existingItem) {
                return prevItems.map(item =>
                    item._id === product._id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            notes: notes || item.notes
                        }
                        : item
                );
            }

            return [...prevItems, {
                ...product,
                quantity,
                notes,
                addedAt: new Date().toISOString()
            }];
        });

        return true;
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => {
            const newItems = prevItems.filter(item => item._id !== productId);

            // Clear selected shop if cart becomes empty
            if (newItems.length === 0) {
                setSelectedShop(null);
            }

            return newItems;
        });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === productId ? { ...item, quantity } : item
            )
        );
    };

    const updateNotes = (productId, notes) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === productId ? { ...item, notes } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setSelectedShop(null);
        localStorage.removeItem('customerCart');
        localStorage.removeItem('selectedShop');
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            const price = item.discountedPrice || item.price;
            return total + (price * item.quantity);
        }, 0);
    };

    const getCartSubtotal = () => {
        return getCartTotal();
    };

    const getDeliveryFee = () => {
        return selectedShop?.deliveryFee || 0;
    };

    const getServiceFee = () => {
        const subtotal = getCartSubtotal();
        return Math.round(subtotal * 0.05); // 5% service fee
    };

    const getTaxes = () => {
        const subtotal = getCartSubtotal();
        return Math.round(subtotal * 0.05); // 5% tax
    };

    const getGrandTotal = () => {
        return getCartSubtotal() + getDeliveryFee() + getServiceFee() + getTaxes();
    };

    const getCartItemsCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const isProductInCart = (productId) => {
        return cartItems.some(item => item._id === productId);
    };

    const getProductQuantityInCart = (productId) => {
        const item = cartItems.find(item => item._id === productId);
        return item ? item.quantity : 0;
    };

    const canAddToCart = (product) => {
        // Check if product is available
        if (!product.isActive || !product.inStock) {
            return { canAdd: false, reason: 'Product is not available' };
        }

        // Check if adding to cart from different shop
        if (selectedShop && selectedShop._id !== product.shopId._id) {
            return {
                canAdd: true,
                requiresConfirmation: true,
                reason: `This will clear items from ${selectedShop.name}`
            };
        }

        return { canAdd: true };
    };

    const validateCart = () => {
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
        if (subtotal < selectedShop.minOrderValue) {
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
    };

    const getOrderSummary = () => {
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
    };

    // Legacy support for existing components
    const cart = cartItems.map(item => ({
        product: item,
        shopId: selectedShop?._id,
        quantity: item.quantity
    }));

    const increaseQuantity = (productId) => {
        updateQuantity(productId, getProductQuantityInCart(productId) + 1);
    };

    const decreaseQuantity = (productId) => {
        updateQuantity(productId, getProductQuantityInCart(productId) - 1);
    };

    const setCart = (newCart) => {
        const items = newCart.map(item => ({
            ...item.product,
            quantity: item.quantity,
            notes: item.notes || ''
        }));
        setCartItems(items);
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