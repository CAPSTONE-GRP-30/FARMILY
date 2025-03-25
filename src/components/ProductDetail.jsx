import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { ShoppingCart, Heart, Star, Check, Truck, Shield } from 'lucide-react';

const ProductDetail = ({ product, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const { addToCart } = useCart();
  const { isAuthenticated } = useUser();

  // Dummy variants for demonstration
  const variants = [
    { id: 'small', name: 'Small', price: 0 },
    { id: 'medium', name: 'Medium', price: 5 },
    { id: 'large', name: 'Large', price: 10 }
  ];

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please log in to add items to cart');
      return;
    }

    try {
      // Include variant information if selected
      const cartProduct = {
        ...product,
        price: selectedVariant 
          ? (parseFloat(product.price) + selectedVariant.price).toFixed(2)
          : product.price,
        variant: selectedVariant ? selectedVariant.name : null
      };

      await addToCart(cartProduct, quantity);
      alert(`Added ${quantity} ${product.name} to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  const renderStars = (rating) => {
    return Array(5).fill().map((_, index) => (
      <Star 
        key={index} 
        className={`w-5 h-5 ${index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl relative overflow-y-auto max-h-[95vh]">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 z-10"
        >
          ✕
        </button>
        
        {/* Product Content */}
        <div className="flex flex-col md:flex-row p-6">
          {/* Left Side - Product Images */}
          <div className="w-full md:w-1/2 pr-0 md:pr-6 mb-6 md:mb-0">
            <div className="border rounded-lg p-4 mb-4 flex justify-center items-center">
              <img 
                src={product.image} 
                alt={product.name} 
                className="max-h-96 max-w-full object-contain"
              />
            </div>
            
            {/* Additional Product Images (Placeholder) */}
            <div className="flex space-x-2 justify-center">
              {[1, 2, 3].map((img) => (
                <div 
                  key={img} 
                  className="w-16 h-16 border rounded-md overflow-hidden cursor-pointer"
                >
                  <img 
                    src={product.image} 
                    alt={`Product thumbnail ${img}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Side - Product Details */}
          <div className="w-full md:w-1/2 pl-0 md:pl-6">
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            
            {/* Rating and Reviews */}
            <div className="flex items-center mb-4">
              <div className="flex mr-2">
                {renderStars(product.rating)}
              </div>
              <span className="text-gray-600">
                ({product.reviews} reviews)
              </span>
            </div>
            
            {/* Price */}
            <div className="mb-4">
              <p className="font-bold text-green-600 text-3xl">
                GHS {product.price}
              </p>
              {product.originalPrice && (
                <p className="text-gray-500 text-sm line-through">
                  {product.originalPrice}
                </p>
              )}
            </div>

            {/* Product Variants */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Size Variants</h3>
              <div className="flex space-x-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`
                      px-4 py-2 border rounded-md 
                      ${selectedVariant?.id === variant.id 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {variant.name} +GHS {variant.price}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity Selector */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={decreaseQuantity} 
                  className="bg-gray-200 px-3 py-1 rounded-md"
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity} 
                  readOnly 
                  className="w-16 text-center border rounded-md py-1"
                />
                <button 
                  onClick={increaseQuantity} 
                  className="bg-gray-200 px-3 py-1 rounded-md"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-4 mb-6">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                <ShoppingCart className="mr-2" /> Add to Cart
              </button>
              <button 
                className="border border-green-500 text-green-500 px-4 py-2 rounded-md flex items-center"
              >
                <Heart className="mr-2" /> Wishlist
              </button>
            </div>
            
            {/* Shipping & Guarantee */}
            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <div className="flex items-center">
                <Truck className="mr-2 text-green-600" />
                <span>Free Shipping on Orders Over GHS 500</span>
              </div>
              <div className="flex items-center">
                <Shield className="mr-2 text-green-600" />
                <span>30-Day Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Information Tabs */}
        <div className="border-t">
          <div className="flex border-b">
            {['details', 'reviews', 'shipping'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 capitalize
                  ${activeTab === tab 
                    ? 'border-b-2 border-green-500 text-green-600' 
                    : 'text-gray-600'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div>
                <h4 className="text-xl font-bold mb-4">Product Details</h4>
                <p className="mb-4">
                  High-quality {product.category} designed for agricultural professionals 
                  and farming enthusiasts. This product meets the highest standards of 
                  performance and reliability.
                </p>
                
                <h5 className="font-semibold mb-2">Key Features:</h5>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Premium quality for optimal farming performance</li>
                  <li>Designed with durability and efficiency in mind</li>
                  <li>Suitable for professional and small-scale farming</li>
                  <li>Meets industry-standard specifications</li>
                  <li>Versatile and easy to use in various scenarios</li>
                </ul>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div>
                <h4 className="text-xl font-bold mb-4">Customer Reviews</h4>
                {/* Placeholder for reviews */}
                <div className="space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border-b pb-4">
                      <div className="flex items-center mb-2">
                        <span className="font-semibold mr-2">John Doe</span>
                        <div className="flex">
                          {renderStars(4)}
                        </div>
                      </div>
                      <p>Great product, highly recommended for farmers!</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'shipping' && (
              <div>
                <h4 className="text-xl font-bold mb-4">Shipping Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Check className="mr-2 text-green-600" />
                    <span>Free shipping on orders over GHS 500</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="mr-2 text-green-600" />
                    <span>Estimated delivery: 3-5 business days</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="mr-2 text-green-600" />
                    <span>Secure packaging with tracking</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;