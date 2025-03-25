import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  CheckCircle,
  Mail,
  X
} from 'lucide-react';

const OrderConfirmationModal = ({ isOpen, onClose, orderDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <X className="w-6 h-6" />
        </button>
        
        <CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-600" />
        
        <h2 className="text-2xl font-bold text-center mb-4">Order Confirmed!</h2>
        
        <div className="text-center mb-4">
          <p className="text-gray-600">
            Your order has been successfully placed and is being processed.
          </p>
          <p className="font-semibold mt-2">Order Total: GHS {orderDetails.total}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center">
            <Mail className="mr-2 text-green-600" /> Order Confirmation
          </h3>
          <p className="text-sm text-gray-600">
            A detailed order confirmation has been sent to {orderDetails.email}
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-4 bg-green-500 text-white py-3 rounded-md hover:bg-green-600"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

const CartScreen = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateCartItemQuantity, 
    calculateCartTotal,
    clearCart 
  } = useCart();
  const { isAuthenticated, currentUser } = useUser();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Handle quantity update
  const handleQuantityUpdate = (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateCartItemQuantity(cartItemId, newQuantity);
    }
  };

  // Proceed to checkout
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      alert('Please log in to proceed with checkout');
      return;
    }

    // Validate user details
    if (!currentUser || !currentUser.email) {
      alert('Please complete your user profile before checkout');
      return;
    }

    setIsCheckingOut(true);

    try {
      // Simulate order processing
      const orderTotal = parseFloat(calculateCartTotal()) > 500 
        ? calculateCartTotal() 
        : (parseFloat(calculateCartTotal()) + 50).toFixed(2);

      // Prepare order details
      const orderInfo = {
        email: currentUser.email,
        total: orderTotal,
        items: cartItems,
        date: new Date().toLocaleDateString()
      };

      // Simulate sending email (in a real app, this would be a backend API call)
      const sendOrderConfirmationEmail = async () => {
        // This would typically be an API call to your backend
        console.log('Sending order confirmation email to:', currentUser.email);
        
        // Simulated email content
        const emailContent = `
          Subject: Order Confirmation - Agricultural Marketplace

          Dear ${currentUser.name || 'Valued Customer'},

          Thank you for your order from Agricultural Marketplace!

          Order Details:
          - Total Amount: GHS ${orderTotal}
          - Number of Items: ${cartItems.length}
          - Order Date: ${new Date().toLocaleDateString()}

          Your order is being processed and will be shipped soon.
          Estimated Delivery: 3-5 business days

          Thank you for shopping with us!

          Best regards,
          Agricultural Marketplace Team
        `;

        // In a real application, this would be an API call to your backend
        console.log('Email Content:', emailContent);
      };

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Send order confirmation email
      await sendOrderConfirmationEmail();

      // Set order details and show confirmation modal
      setOrderDetails({
        email: currentUser.email,
        total: orderTotal
      });

      // Clear cart and show confirmation
      clearCart();
      setIsCheckingOut(false);
      setIsOrderConfirmed(true);

    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
      setIsCheckingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="mx-auto mb-4 w-16 h-16 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-4">Please log in to view and manage your cart</p>
            <button 
              className="bg-green-500 text-white px-6 py-2 rounded-md"
            >
              Log In
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Order Confirmation Modal */}
      <OrderConfirmationModal 
        isOpen={isOrderConfirmed}
        onClose={() => setIsOrderConfirmed(false)}
        orderDetails={orderDetails}
      />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <ShoppingCart className="mr-3 text-green-600" /> Your Cart
        </h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto mb-4 w-16 h-16 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-4">
              Explore our marketplace and add some products to get started!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center border rounded-lg p-4 hover:shadow-sm transition"
                >
                  {/* Product Image */}
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-24 h-24 object-cover rounded-md mr-4"
                  />
                  
                  {/* Product Details */}
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    {item.variant && (
                      <p className="text-gray-600 text-sm">
                        Variant: {item.variant}
                      </p>
                    )}
                    <p className="text-green-600 font-bold">
                      GHS {item.price}
                    </p>
                  </div>
                  
                  {/* Quantity Control */}
                  <div className="flex items-center space-x-2 mr-4">
                    <button 
                      onClick={() => handleQuantityUpdate(item.id, item.quantity, -1)}
                      className="bg-gray-200 p-1 rounded-md"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityUpdate(item.id, item.quantity, 1)}
                      className="bg-gray-200 p-1 rounded-md"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="border rounded-lg p-6 sticky top-20">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                
                {/* Cart Total */}
                <div className="flex justify-between mb-4">
                  <span>Subtotal</span>
                  <span className="font-bold">
                    GHS {calculateCartTotal()}
                  </span>
                </div>
                
                {/* Shipping */}
                <div className="flex justify-between mb-4 text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {parseFloat(calculateCartTotal()) > 500 ? 'Free' : 'GHS 50'}
                  </span>
                </div>
                
                <div className="border-t pt-4 mb-4"></div>
                
                {/* Total */}
                <div className="flex justify-between font-bold text-lg mb-6">
                  <span>Total</span>
                  <span>
                    GHS {parseFloat(calculateCartTotal()) > 500 
                      ? calculateCartTotal() 
                      : (parseFloat(calculateCartTotal()) + 50).toFixed(2)}
                  </span>
                </div>
                
                {/* Checkout Button */}
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className={`
                    w-full py-3 rounded-md text-white flex items-center justify-center
                    ${isCheckingOut 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                    }
                  `}
                >
                  {isCheckingOut ? (
                    <>
                      <CheckCircle className="mr-2 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default CartScreen;