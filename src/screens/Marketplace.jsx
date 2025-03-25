import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Filter, Heart, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductDetail from '../components/ProductDetail';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';

const Marketplace = () => {
  const [selectedCategories, setSelectedCategories] = useState({
    tools: false,
    fertilizers: false,
    seeds: false
  });

  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);

  const { addToCart } = useCart();
  const { isAuthenticated } = useUser();

  // Approximate exchange rate (this should be fetched from a real-time API in production)
  const USD_TO_GHS_RATE = 12.5;

  // Convert USD to GHS
  const convertToGHS = (priceUSD) => {
    return (priceUSD * USD_TO_GHS_RATE).toFixed(2);
  };

  // Categorize products
  const categorizeProduct = (productName) => {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('tool') || lowerName.includes('equipment')) return 'tools';
    if (lowerName.includes('fertilizer') || lowerName.includes('nutrient')) return 'fertilizers';
    if (lowerName.includes('seed') || lowerName.includes('plant')) return 'seeds';
    return 'other';
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useMemo(() => {
    return () => {
      let filtered = [...products];

      // Category Filter
      const activeCategories = Object.keys(selectedCategories).filter(cat => selectedCategories[cat]);
      if (activeCategories.length > 0) {
        filtered = filtered.filter(product => {
          const productCategory = categorizeProduct(product.name);
          return activeCategories.includes(productCategory);
        });
      }

      // Price Range Filter
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price);
        return price >= priceRange.min && price <= priceRange.max;
      });

      // Search Term Filter
      if (searchTerm) {
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sorting
      switch (sortOption) {
        case 'price-low':
          filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price-high':
          filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        default:
          // Default sorting (could be by added date, popularity, etc.)
          break;
      }

      return filtered;
    };
  }, [products, selectedCategories, priceRange, searchTerm, sortOption]);

  // Fetch products
  useEffect(() => {
    const fetchFarmProducts = async () => {
      try {
        setLoading(true);
        const categories = ['farm tools', 'agricultural fertilizers', 'farming seeds'];
        const allProducts = [];

        for (const category of categories) {
          const response = await fetch('https://google.serper.dev/shopping', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': '3d7075e76ee12d7d842d9acd077a30d197cfe5b6'
            },
            body: JSON.stringify({
              q: category,
              gl: 'us',
              hl: 'en'
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch ${category} products`);
          }

          const data = await response.json();
          
          // Transform Serper API results
          const formattedCategoryProducts = data.shopping?.map((item, index) => ({
            id: `${category}-${index + 1}`,
            name: item.title || `${category} Product`,
            rating: Math.floor(Math.random() * 5) + 1,
            reviews: Math.floor(Math.random() * 200),
            price: convertToGHS(parseFloat(item.price?.replace(/[^0-9.-]+/g,"") || '0')),
            image: item.imageUrl || '/api/placeholder/200/200',
            favorite: false,
            originalPrice: item.price,
            category: categorizeProduct(item.title || '')
          })) || [];

          allProducts.push(...formattedCategoryProducts);
        }

        setProducts(allProducts);
        setFilteredProducts(allProducts);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFarmProducts();
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    setFilteredProducts(applyFiltersAndSort());
  }, [applyFiltersAndSort]);

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Add to cart handler
  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      alert('Please log in to add items to cart');
      return;
    }

    try {
      await addToCart(product);
      alert(`Added ${product.name} to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  // Open product detail modal
  const openProductDetail = (product) => {
    setSelectedProduct(product);
  };

  // Close product detail modal
  const closeProductDetail = () => {
    setSelectedProduct(null);
  };

  // Render star rating
  const renderStars = (rating) => {
    return Array(5).fill().map((_, index) => (
      <Star 
        key={index} 
        className={`w-4 h-4 ${index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Banner */}
      <div 
        className="bg-cover bg-center h-64" 
        style={{backgroundImage: 'url("/images/12.png")'}}
      >
        <div className="container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-white">Agricultural Marketplace</h1>
          <p className="text-white mt-2">
            Discover premium farming tools, seeds, and fertilizers
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex">
          {/* Sidebar Filters */}
          <div className="w-64 pr-6">
            <div className="bg-white shadow rounded-lg p-4">
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  />
                  <Filter className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              
              {/* Categories */}
              <div className="space-y-2 mb-4">
                <h3 className="font-semibold flex items-center">
                  <Filter className="mr-2 text-green-600" /> Categories
                </h3>
                {[
                  { id: 'tools', label: 'Farm Tools' },
                  { id: 'fertilizers', label: 'Fertilizers' },
                  { id: 'seeds', label: 'Seeds' }
                ].map(category => (
                  <div key={category.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={category.id} 
                      className="mr-2"
                      checked={selectedCategories[category.id]}
                      onChange={() => handleCategoryToggle(category.id)}
                    />
                    <label htmlFor={category.id}>{category.label}</label>
                  </div>
                ))}
              </div>
              
              {/* Price Range */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Price Range (GHS)</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({
                        ...prev, 
                        min: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span>-</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({
                        ...prev, 
                        max: parseFloat(e.target.value) || 1000
                      }))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sorting */}
              <div>
                <h3 className="font-semibold mb-2">Sort By</h3>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="default">Default</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="text-center py-8">
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>Error: {error}</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    {filteredProducts.length} Products
                  </h2>
                </div>
                
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No products found matching your filters.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {currentProducts.map(product => (
                        <div 
                          key={product.id} 
                          className="border rounded-lg p-4 text-center relative group"
                        >
                          {/* Wishlist Button */}
                          <button 
                            className="absolute top-2 right-2 z-10 text-gray-400 hover:text-red-500"
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                          
                          {/* Product Image */}
                          <div 
                            onClick={() => openProductDetail(product)}
                            className="cursor-pointer"
                          >
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="mx-auto mb-4 h-40 w-40 object-cover"
                            />
                          </div>
                          
                          {/* Product Details */}
                          <h4 
                            className="font-semibold truncate mb-2" 
                            title={product.name}
                          >
                            {product.name}
                          </h4>
                          
                          {/* Rating */}
                          <div className="flex justify-center items-center mb-2">
                            <div className="flex">
                              {renderStars(product.rating)}
                            </div>
                            <span className="ml-2 text-gray-600 text-sm">
                              ({product.reviews})
                            </span>
                          </div>
                          
                          {/* Price */}
                          <div className="mb-2">
                            <p className="font-bold text-green-600">
                              GHS {product.price}
                            </p>
                            {product.originalPrice && (
                              <p className="text-gray-500 text-sm line-through">
                                {product.originalPrice}
                              </p>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md flex items-center justify-center"
                            >
                              <ShoppingCart className="mr-2 w-4 h-4" /> Add to Cart
                            </button>
                            <button 
                              onClick={() => openProductDetail(product)}
                              className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex justify-center mt-6">
                      <div className="flex space-x-2">
                        {Array.from({ 
                          length: Math.ceil(filteredProducts.length / productsPerPage) 
                        }).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => paginate(index + 1)}
                            className={`
                              px-4 py-2 rounded-md
                              ${currentPage === index + 1 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-700'
                              }
                            `}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onClose={closeProductDetail} 
        />
      )}
    </div>
  );
};

export default Marketplace;