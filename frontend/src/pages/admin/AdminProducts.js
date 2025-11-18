import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import FileUpload from '../../components/FileUpload';

const AdminProducts = () => {
  const { api } = useAuth(); // Use 'api'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shirts',
    featured: false,
    images: [],
    variants: [] // Simple variant handling for now
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (fileData) => {
    // fileData can be a single object or an array depending on the component
    const newImages = Array.isArray(fileData) 
      ? fileData.map(f => ({ url: f.url, alt: f.name }))
      : [{ url: fileData.url, alt: fileData.name }];

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const handleSaveProduct = async () => {
    try {
      // Basic validation
      if (!formData.name || !formData.price) {
        toast.error('Name and Price are required');
        return;
      }

      // Default variant if none added (to prevent backend errors)
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        variants: formData.variants.length > 0 ? formData.variants : [
           { color: "Standard", color_code: "#000000", sizes: { "S": 10, "M": 10, "L": 10, "XL": 10 } }
        ]
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
        toast.success('Product updated');
      } else {
        await api.post('/products', productData);
        toast.success('Product created');
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      featured: product.featured,
      images: product.images,
      variants: product.variants
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'shirts',
      featured: false,
      images: [],
      variants: []
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold playfair text-black">Products</h1>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
             setIsModalOpen(open);
             if(!open) { setEditingProduct(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none">
                <Plus className="mr-2" size={20} />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-none border-black">
              <DialogHeader>
                <DialogTitle className="playfair text-2xl">{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="rounded-none border-gray-300 focus:border-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="rounded-none border-gray-300 focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="rounded-none border-gray-300 focus:border-black"
                  />
                </div>

                <div>
                  <Label>Images</Label>
                  <div className="grid grid-cols-4 gap-2 mb-4 mt-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.url} alt="" className="w-full h-20 object-cover border border-gray-200" />
                        <button 
                          onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FileUpload 
                    onUpload={handleImageUpload} 
                    multiple={true} 
                    label="Add Images"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="featured" 
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                    className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>

                <Button onClick={handleSaveProduct} className="w-full bg-black text-white hover:bg-gray-800 rounded-none py-6">
                  Save Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Image</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Price</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Variants</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <motion.tr 
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <img 
                          src={product.images[0]?.url || '/placeholder.jpg'} 
                          alt={product.name} 
                          className="w-12 h-12 object-cover border border-gray-200"
                        />
                      </td>
                      <td className="py-4 px-6 font-medium text-black">{product.name}</td>
                      <td className="py-4 px-6 text-black">₹{product.price}</td>
                      <td className="py-4 px-6 text-gray-600">{product.variants.length} variants</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                            <Edit size={18} className="text-gray-600 hover:text-black" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 size={18} className="text-red-500 hover:text-red-700" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminProducts;