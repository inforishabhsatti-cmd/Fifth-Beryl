import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
// Footer import is kept but component usage removed from return
import Footer from '../../components/Footer'; 
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';

const AdminInventory = () => {
  const { api } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/analytics/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair text-black">Inventory Management</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Product Name & Variant</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Stock by Size (Qty)</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Total Stock</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.flatMap((product, index) => (
                      product.variants.map((variant, vIndex) => {
                          const sizes = Object.entries(variant.sizes);
                          const totalVariantStock = sizes.reduce((sum, [, stock]) => sum + stock, 0);
                          
                          // Fix: Status logic based on total variant stock
                          const status = totalVariantStock === 0 ? 'Out of Stock' : totalVariantStock < 10 ? 'Low Stock' : 'In Stock';
                          const statusColor = totalVariantStock === 0 ? 'bg-gray-100 text-gray-500 border border-gray-300' : totalVariantStock < 10 ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-600 border border-green-200';
                          
                          return (
                            <motion.tr 
                              key={`${product.id}-${vIndex}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-6 font-medium text-black">
                                {product.name}
                                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <span className="w-3 h-3 rounded-full inline-block border border-gray-300" style={{ backgroundColor: variant.color_code }}></span>
                                    {variant.color}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-gray-600">
                                {sizes.map(([size, stock]) => (
                                  <span 
                                    key={size} 
                                    className={`inline-block mr-4 text-sm ${stock === 0 ? 'text-red-500 line-through' : stock < 5 ? 'text-red-500 font-semibold' : 'font-medium'}`}
                                  >
                                    {size}: {stock}
                                  </span>
                                ))}
                              </td>
                              <td className="py-4 px-6 font-mono font-bold text-lg text-black">
                                {totalVariantStock}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded ${statusColor}`}>
                                  {status}
                                </span>
                              </td>
                            </motion.tr>
                          );
                      })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;