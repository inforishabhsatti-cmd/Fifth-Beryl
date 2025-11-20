import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Product Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Total Stock</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Stock Level</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => {
                    const status = item.total_stock === 0 ? 'Out of Stock' : item.total_stock < 10 ? 'Low Stock' : 'In Stock';
                    // Updated to black/white/red styling
                    const statusColor = item.total_stock === 0 ? 'bg-gray-100 text-gray-500 border border-gray-300' : item.total_stock < 10 ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-white text-black border border-black';
                    const progressValue = Math.min((item.total_stock / 50) * 100, 100); // Assume 50 is "full" stock for visual
                    
                    return (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 font-medium text-black">{item.name}</td>
                        <td className="py-4 px-6 text-gray-600 font-mono">{item.total_stock}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-6 w-1/4">
                           <div className="flex items-center gap-3">
                             {/* Indicator color logic */}
                             <Progress value={progressValue} className="h-2 bg-gray-100" indicatorClassName={item.total_stock < 10 ? "bg-red-500" : "bg-black"} />
                             {item.total_stock < 10 && item.total_stock > 0 && (
                               <AlertTriangle size={16} className="text-red-500" />
                             )}
                             {item.total_stock >= 10 && (
                               <CheckCircle size={16} className="text-black" />
                             )}
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })}
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