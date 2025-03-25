import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUser } from './UserContext';

// Create Cart Context
const CartContext = createContext();

// Custom hook for using the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  const { currentUser } = useUser();

  // Fetch cart items for the current user
  const fetchCartItems = async () => {
    if (!currentUser) return;

    setCartLoading(true);
    try {
      const cartQuery = query(
        collection(db, 'cart'), 
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCartItems(items);
      setCartError(null);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setCartError('Failed to load cart items');
    } finally {
      setCartLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    if (!currentUser) {
      throw new Error('User must be logged in to add items to cart');
    }

    try {
      // Check if product already exists in cart
      const existingCartItem = cartItems.find(
        item => item.productId === product.id
      );

      if (existingCartItem) {
        // Update quantity of existing cart item
        const cartItemRef = doc(db, 'cart', existingCartItem.id);
        await updateDoc(cartItemRef, {
          quantity: existingCartItem.quantity + quantity,
          updatedAt: serverTimestamp()
        });

        // Update local state
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === existingCartItem.id 
              ? { ...item, quantity: item.quantity + quantity } 
              : item
          )
        );
      } else {
        // Add new item to cart
        const newCartItem = {
          userId: currentUser.uid,
          productId: product.id,
          name: product.name,
          image: product.image,
          price: parseFloat(product.price),
          originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
          quantity: quantity,
          category: product.category || 'other',
          addedAt: serverTimestamp(),
          seller: {
            name: `${product.category} Supplier`,
            contact: `support@${product.category}market.com`
          },
          metadata: {
            rating: product.rating,
            reviews: product.reviews
          }
        };

        const docRef = await addDoc(collection(db, 'cart'), newCartItem);
        
        // Update local state
        setCartItems(prevItems => [
          ...prevItems, 
          { id: docRef.id, ...newCartItem }
        ]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartError('Failed to add item to cart');
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    try {
      await deleteDoc(doc(db, 'cart', cartItemId));
      
      // Update local state
      setCartItems(prevItems => 
        prevItems.filter(item => item.id !== cartItemId)
      );
    } catch (error) {
      console.error('Error removing from cart:', error);
      setCartError('Failed to remove item from cart');
      throw error;
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    try {
      const cartItemRef = doc(db, 'cart', cartItemId);
      await updateDoc(cartItemRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity } 
            : item
        )
      );
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      setCartError('Failed to update cart item quantity');
      throw error;
    }
  };

  // Calculate cart total
  const calculateCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    ).toFixed(2);
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!currentUser) return;

    try {
      const cartQuery = query(
        collection(db, 'cart'), 
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(cartQuery);
      const batch = [];

      querySnapshot.docs.forEach(document => {
        batch.push(deleteDoc(document.ref));
      });

      await Promise.all(batch);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      setCartError('Failed to clear cart');
      throw error;
    }
  };

  // Fetch cart items when user changes
  useEffect(() => {
    fetchCartItems();
  }, [currentUser]);

  const value = {
    cartItems,
    cartLoading,
    cartError,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    calculateCartTotal,
    clearCart,
    fetchCartItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;