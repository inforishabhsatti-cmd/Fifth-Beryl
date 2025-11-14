import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminInventory = () => {
  const { token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/analytics/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="outline" size="icon" data-testid="back-btn">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold playfair" data-testid="admin-inventory-title">Inventory Management</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="space-y-6" data-testid="inventory-list">
            {inventory.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
                data-testid={`inventory-item-${index}`}
              >
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-2xl font-semibold playfair">{product.name}</h3>
                      {product.total_stock < 10 && (
                        <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                          <AlertTriangle size={16} />
                          <span className="text-sm font-semibold">Low Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-lg font-semibold text-emerald-600">
                        Total Stock: {product.total_stock} units
                      </span>
                    </div>

                    <div className="space-y-4">
                      {product.variants.map((variant, variantIndex) => (
                        <div key={variantIndex} className="border-l-4 border-emerald-500 pl-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: variant.color_code }}
                            />
                            <span className="font-semibold">{variant.color}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-4">
                            {Object.entries(variant.sizes).map(([size, stock]) => (
                              <div
                                key={size}
                                className={`p-3 rounded-lg text-center ${
                                  stock === 0
                                    ? 'bg-red-50 text-red-800'
                                    : stock < 5
                                    ? 'bg-yellow-50 text-yellow-800'
                                    : 'bg-green-50 text-green-800'
                                }`}
                              >
                                <p className="text-sm font-semibold">{size}</p>
                                <p className="text-2xl font-bold">{stock}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminInventory;