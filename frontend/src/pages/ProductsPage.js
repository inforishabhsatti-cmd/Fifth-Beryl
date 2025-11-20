import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // ADDED: Helmet for SEO
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard'; 
import { useAuth } from '../context/AuthContext'; 

import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label'; // FIX: ADDED Label import

const ProductsPage = () => {
  const navigate = useNavigate();
  const { api } = useAuth(); 
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Debounce effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); 
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm]);

  // Fetch products effect
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchTerm, sortBy, currentPage]); 

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      params.append('sort', sortBy);
      params.append('page', currentPage);
      params.append('limit', 12); 

      // MODIFIED: Use `api.get` from AuthContext for authenticated and base URL handling
      const response = await api.get(`/products?${params.toString()}`);
      
      setProducts(response.data.products);
      setTotalProducts(response.data.total_products);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  const handleSortChange = (value) => {
      setSortBy(value);
      setCurrentPage(1);
  }
  
  const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
  }
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-4 mt-12">
            <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                className="rounded-none border-black hover:bg-black hover:text-white"
            >
                Previous
            </Button>
            <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                className="rounded-none border-black hover:bg-black hover:text-white"
            >
                Next
            </Button>
        </div>
    );
  };
  
  const handleClearSearch = () => {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setCurrentPage(1);
  }

  return (
    <div className="min-h-screen pt-32 bg-white"> 
      
      <Helmet>
        <title>Shop All Premium Shirts | Fifth Beryl Collection</title>
        <meta name="description" content={`Discover the complete collection of Fifth Beryl's handcrafted premium shirts. ${totalProducts > 0 ? `Currently showing ${totalProducts} shirts.` : 'No shirts found.'} Free shipping available.`} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-b border-gray-100 pb-8"
        >
          <h1 className="text-5xl font-bold mb-3 playfair text-black">The Collection</h1>
          <p className="text-gray-500">Shop all {totalProducts} shirts available</p>
        </motion.div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <div className="flex w-full md:w-1/3 space-x-2">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 border-gray-300 focus:border-black rounded-none"
                  data-testid="search-input"
                />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="sort" className="text-sm text-gray-700">Sort By:</Label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger id="sort" className="w-full sm:w-[180px] rounded-none border-gray-300 focus:border-black">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price (Low to High)</SelectItem>
                <SelectItem value="price-high">Price (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">No products found {debouncedSearchTerm && `matching "${debouncedSearchTerm}"`}.</p>
            {debouncedSearchTerm && <Button onClick={handleClearSearch} className="mt-4 bg-black text-white rounded-none">Clear Search</Button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;