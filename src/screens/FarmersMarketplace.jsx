import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { 
  Camera, 
  Plus, 
  ShoppingCart, 
  Trash2, 
  Edit, 
  Store, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Check 
} from 'lucide-react';
import { useUser } from '../context/UserContext'; 
import { db } from '../firebaseConfig';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Product Modal Component
const ProductDetailModal = ({ product, onClose, onAddToCart }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-50 bg-gray-200 rounded-full p-2 hover:bg-gray-300 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Product Image */}
        {product.image && (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-64 object-cover rounded-t-lg"
          />
        )}

        {/* Product Details */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
          
          {/* Price and Availability */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-bold text-green-600">
              ${product.price.toFixed(2)}
            </span>
            <div className="flex items-center">
              <span className={`
                px-3 py-1 rounded-full text-sm font-semibold 
                ${product.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              `}>
                {product.quantity > 0 ? `${product.quantity} Available` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Farm Details */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Farm Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Store className="mr-2 text-green-600" size={20} />
                <span>{product.farmLocation.name}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 text-green-600" size={20} />
                <span>
                  {product.farmLocation.address}, {product.farmLocation.city}, 
                  {product.farmLocation.state} {product.farmLocation.zipCode}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Contact Seller</h3>
            <div className="space-y-2">
              {product.contactInfo?.email && (
                <div className="flex items-center">
                  <Mail className="mr-2 text-green-600" size={20} />
                  <span>{product.contactInfo.email}</span>
                </div>
              )}
              {product.contactInfo?.phone && (
                <div className="flex items-center">
                  <Phone className="mr-2 text-green-600" size={20} />
                  <span>{product.contactInfo.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          
        </div>
      </div>
    </div>
  );
};

const FarmersMarketplace = () => {
  const { currentUser, userProfile } = useUser();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    quantity: '',
    image: null,
    organic: false,
    tags: [],
    farmLocation: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    contactInfo: {
      phone: '',
      email: ''
    }
  });
  const [products, setProducts] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  const categories = [
    'Vegetables', 
    'Fruits', 
    'Dairy', 
    'Eggs', 
    'Meat', 
    'Herbs', 
    'Other Farm Produce'
  ];

  const tags = [
    'Organic', 
    'Local', 
    'Fresh', 
    'Sustainable', 
    'Seasonal'
  ];

  // Fetch products when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserProducts();
    }
    fetchLocalProducts();
  }, [currentUser]);

  // Fetch user's products from Firestore
  const fetchUserProducts = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('sellerId', '==', currentUser.uid));
      
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch local products from all sellers
  const fetchLocalProducts = async () => {
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const fetchedLocalProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setLocalProducts(fetchedLocalProducts);
    } catch (err) {
      console.error('Error fetching local products:', err);
      setError('Failed to load local products');
    } finally {
      setLoading(false);
    }
  };

  // Add to Cart Handler
  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? {...item, quantity: item.quantity + 1} 
          : item
      ));
    } else {
      setCart([...cart, {...product, cartQuantity: 1}]);
    }
    
    alert(`Added ${product.name} to cart!`);
  };

  // Product Click Handler to Open Modal
  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  // Handle input changes for product details
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Check if it's a nested input
    if (name.includes('farmLocation.')) {
      const field = name.split('.')[1];
      setProductDetails(prev => ({
        ...prev,
        farmLocation: {
          ...prev.farmLocation,
          [field]: value
        }
      }));
    } else if (name.includes('contactInfo.')) {
      const field = name.split('.')[1];
      setProductDetails(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setProductDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle image upload using Base64 encoding
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Limit image size to prevent Firestore document size issues
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          // Resize if needed
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to smaller, compressed Base64
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);

          setProductDetails(prev => ({
            ...prev,
            image: resizedBase64
          }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new product to Firestore
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!productDetails.name || !productDetails.price) {
      alert('Please fill in required fields');
      return;
    }

    // Ensure user is authenticated
    if (!currentUser || !userProfile) {
      alert('Please log in to list a product');
      return;
    }

    setLoading(true);
    try {
      // Prepare product data for Firestore
      const productData = {
        ...productDetails,
        price: parseFloat(productDetails.price),
        quantity: parseInt(productDetails.quantity) || 0,
        sellerId: currentUser.uid,
        sellerUsername: userProfile.username || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'available',
        farmLocation: {
          name: productDetails.farmLocation.name || userProfile.farmName || 'My Farm',
          address: productDetails.farmLocation.address || '',
          city: productDetails.farmLocation.city || userProfile.city || 'Unknown',
          state: productDetails.farmLocation.state || userProfile.state || 'Unknown',
          zipCode: productDetails.farmLocation.zipCode || ''
        },
        contactInfo: {
          phone: productDetails.contactInfo.phone || userProfile.phone || '',
          email: productDetails.contactInfo.email || userProfile.email || ''
        }
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);

      // Update local state
      setProducts(prev => [
        { id: docRef.id, ...productData }, 
        ...prev
      ]);

      // Refresh local products
      await fetchLocalProducts();

      // Reset form
      setProductDetails({
        name: '',
        description: '',
        price: '',
        category: '',
        quantity: '',
        image: null,
        organic: false,
        tags: [],
        farmLocation: {
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: ''
        },
        contactInfo: {
          phone: '',
          email: ''
        }
      });

      // Switch to browse tab
      setActiveTab('browse');
    } catch (err) {
      console.error('Error submitting product:', err);
      setError('Failed to list product');
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      
      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      // Refresh local products
      await fetchLocalProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  // Edit a product (simplified - could be expanded to a modal or separate page)
  const handleEditProduct = async (productId) => {
    const productToEdit = products.find(p => p.id === productId);
    
    try {
      const updateData = {
        ...productToEdit,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'products', productId), updateData);
      
      // Refresh products list
      await fetchUserProducts();
      await fetchLocalProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    }
  };

  // Render user's products
  const renderProductContent = () => {
    if (!currentUser) {
      return (
        <div className="text-center text-gray-500 py-8">
          Please log in to view and list products
        </div>
      );
    }

    if (loading) {
      return <div className="text-center py-8">Loading products...</div>;
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-8">
          {error}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProductClick(product)}
            >
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {product.quantity} available
                  </span>
                </div>
                <div className="mt-2">
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-700">
                    Farm: {product.farmLocation.name}, {product.farmLocation.city}, {product.farmLocation.state}
                  </p>
                </div>
                <div className="flex mt-2 space-x-2">
                  <button 
                    className="flex-1 bg-red-500 text-white py-2 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                  >
                    <Trash2 className="inline-block mr-2" size={16} /> 
                    Delete
                  </button>
                  <button 
                    className="flex-1 bg-blue-500 text-white py-2 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProduct(product.id);
                    }}
                  >
                    <Edit className="inline-block mr-2" size={16} /> 
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </>
    );
  };

  // Render local products
  const renderLocalProducts = () => {
    if (loading) {
      return <div className="text-center py-8">Loading local products...</div>;
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-8">
          {error}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {localProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleProductClick(product)}
            >
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {product.quantity} available
                  </span>
                </div>
                <div className="mt-2">
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-700">
                    Farm: {product.farmLocation.name}, {product.farmLocation.city}, {product.farmLocation.state}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow p-4 bg-gray-50">
        {/* Tab Navigation */}
        <div className="flex mb-4 bg-white shadow-sm rounded-full">
          <button
            className={`flex-1 py-2 rounded-full transition-all ${
              activeTab === 'browse' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('browse')}
          >
            <ShoppingCart className="inline-block mr-2" size={20} />
            My Products
          </button>
          <button
            className={`flex-1 py-2 rounded-full transition-all ${
              activeTab === 'sell' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('sell')}
          >
            <Plus className="inline-block mr-2" size={20} />
            List Product
          </button>
          <button
            className={`flex-1 py-2 rounded-full transition-all ${
              activeTab === 'local' 
                ? 'bg-green-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('local')}
          >
            <Store className="inline-block mr-2" size={20} />
            Local Products
          </button>
        </div>

        {/* Browse Products Tab */}
        {activeTab === 'browse' && renderProductContent()}

        {/* Sell Product Tab */}
        {activeTab === 'sell' && (
          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <h2 className="text-xl font-bold mb-4">List Your Farm Product</h2>
            
            {/* Image Upload */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Image
              </label>
              <div className="flex items-center">
                {productDetails.image ? (
                  <img 
                    src={productDetails.image} 
                    alt="Product" 
                    className="w-32 h-32 object-cover rounded-lg mr-4"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mr-4 flex items-center justify-center">
                    <Camera className="text-gray-500" />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="product-image"
                />
                <label 
                  htmlFor="product-image" 
                  className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer"
                >
                  Upload Image
                </label>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input 
                type="text"
                name="name"
                value={productDetails.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., Fresh Organic Tomatoes"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea 
                name="description"
                value={productDetails.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
                placeholder="Describe your product"
                rows="3"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                value={productDetails.category}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Price ($)
                </label>
                <input 
                  type="number"
                  name="price"
                  value={productDetails.price}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input 
                  type="number"
                  name="quantity"
                  value={productDetails.quantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Available units"
                  min="0"
                />
              </div>
            </div>

            {/* Farm Location Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Farm Name
                </label>
                <input 
                  type="text"
                  name="farmLocation.name"
                  value={productDetails.farmLocation.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Your Farm Name"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Address
                </label>
                <input 
                  type="text"
                  name="farmLocation.address"
                  value={productDetails.farmLocation.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Farm Address"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  City
                </label>
                <input 
                  type="text"
                  name="farmLocation.city"
                  value={productDetails.farmLocation.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  State
                </label>
                <input 
                  type="text"
                  name="farmLocation.state"
                  value={productDetails.farmLocation.state}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input 
                  type="text"
                  name="farmLocation.zipCode"
                  value={productDetails.farmLocation.zipCode}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Zip Code"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input 
                  type="tel"
                  name="contactInfo.phone"
                  value={productDetails.contactInfo.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input 
                  type="email"
                  name="contactInfo.email"
                  value={productDetails.contactInfo.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Contact Email"
                />
              </div>
            </div>

            {/* Additional Product Details */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label key={tag} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={productDetails.tags.includes(tag)}
                      onChange={(e) => {
                        setProductDetails(prev => ({
                          ...prev,
                          tags: e.target.checked 
                            ? [...prev.tags, tag]
                            : prev.tags.filter(t => t !== tag)
                        }));
                      }}
                    />
                    <span className="ml-2">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="organic"
                checked={productDetails.organic}
                onChange={(e) => {
                  setProductDetails(prev => ({
                    ...prev,
                    organic: e.target.checked
                  }));
                }}
                className="mr-2"
              />
              <label htmlFor="organic" className="text-sm">
                Is this product organic?
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Listing Product...' : 'List Product'}
            </button>
          </form>
        )}

        {/* Local Products Tab */}
        {activeTab === 'local' && renderLocalProducts()}
      </div>
      
      <Footer />
    </div>
  );
};

export default FarmersMarketplace;