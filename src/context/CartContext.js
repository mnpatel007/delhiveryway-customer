import { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    const saveCart = (updatedCart) => {
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const addToCart = (product, shopId) => {
        const updated = [...cart];
        const index = updated.findIndex(item => item.product._id === product._id);
        if (index !== -1) {
            updated[index].quantity += 1;
        } else {
            updated.push({ product, shopId, quantity: 1 });
        }
        saveCart(updated);
    };

    const increaseQuantity = (productId) => {
        const updated = cart.map(item =>
            item.product._id === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
        );
        saveCart(updated);
    };

    const decreaseQuantity = (productId) => {
        const updated = cart
            .map(item =>
                item.product._id === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
            .filter(item => item.quantity > 0);
        saveCart(updated);
    };

    const removeFromCart = (productId) => {
        const updated = cart.filter(item => item.product._id !== productId);
        saveCart(updated);
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('cart');
    };

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, clearCart,
            increaseQuantity, decreaseQuantity, setCart // ✅ add this
        }}>
            {children}
        </CartContext.Provider>
    );

};
