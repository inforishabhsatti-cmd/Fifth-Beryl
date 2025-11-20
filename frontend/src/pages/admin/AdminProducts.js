import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ArrowLeft, X, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'; // ADDED: Select
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import FileUpload from '../../components/FileUpload';

// NOTE: This component MUST be defined in or imported into this file for the modal to work.
// If you defined it elsewhere, ensure it is available here.
const VariantEditor = ({ variants, setVariants }) => {
  const addVariant = () => {
    setVariants([...variants, { color: '', color_code: '#000000', sizes: { "S": 0, "M": 0, "L": 0, "XL": 0 } }]);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const updateStock = (variantIndex, size, stock) => {
    const newVariants = [...variants];
    newVariants[variantIndex].sizes[size] = parseInt(stock) || 0;
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  
  const defaultSizes = ["S", "M", "L", "XL"]; 

  return (
    <div className="space-y-4 border border-gray-200 p-4 bg-gray-50">
      <h3 className="font-semibold text-lg text-black flex items-center gap-2">
        <LayoutGrid size={18} /> Product Variants
      </h3>
      
      {variants.map((variant, vIndex) => (
        <div key={vIndex} className="bg-white p-4 border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-black">Variant #{vIndex + 1}</h4>
            <Button variant="ghost" size="icon" onClick={() => removeVariant(vIndex)}>
              <X size={16} className="text-red-500" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`color-${vIndex}`}>Color Name</Label>
              <Input
                id={`color-${vIndex}`}
                value={variant.color}
                onChange={(e) => updateVariant(vIndex, 'color', e.target.value)}
                className="rounded-none border-gray-300 focus:border-black"
                placeholder="e.g., Ocean Blue"
              />
            </div>
            <div>
              <Label htmlFor={`color_code-${vIndex}`}>Color Code</Label>
              <div className="flex items-center gap-2 mt-1">
                  <Input
                    id={`color_code-${vIndex}`}
                    type="color"
                    value={variant.color_code}
                    onChange={(e) => updateVariant(vIndex, 'color_code', e.target.value)}
                    className="rounded-none border-gray-300 focus:border-black w-10 h-10 p-0"
                  />
                  <Input
                    type="text"
                    value={variant.color_code}
                    onChange={(e) => updateVariant(vIndex, 'color_code', e.target.value)}
                    className="rounded-none border-gray-300 focus:border-black flex-grow"
                    placeholder="#RRGGBB"
                  />
              </div>
            </div>
          </div>
          
          {/* Stock Inputs */}
          <div className="pt-4 border-t border-gray-100">
             <h4 className="font-medium mb-2 text-black">Stock by Size:</h4>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {defaultSizes.map(size => (
                  <div key={size}>
                    <Label htmlFor={`stock-${vIndex}-${size}`}>{size}</Label>
                    <Input
                      id={`stock-${vIndex}-${size}`}
                      type="number"
                      min="0"
                      value={variant.sizes[size] || 0}
                      onChange={(e) => updateStock(vIndex, size, e.target.value)}
                      className="rounded-none border-gray-300 focus:border-black"
                      placeholder="0"
                    />
                  </div>
                ))}
             </div>
          </div>
        </div>
      ))}
      
      <Button 
        type="button" 
        onClick={addVariant} 
        variant="outline" 
        className="w-full rounded-none border-dashed border-gray-400 text-gray-600 hover:bg-gray-100"
      >
        <Plus size={16} className="mr-2" /> Add Variant
      </Button>
    </div>
  );
};


const AdminProducts = () => {
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // MODIFIED: Added mrp and fit to formData state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mrp: '',
    price: '', // price is Sale Price
    fit: 'Regular Fit', // ADDED: Default fit
    category: 'shirts',
    featured: false,
    images: [],
    variants: []
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
      if (!formData.name || !formData.price || !formData.fit || !formData.description) {
        toast.error('Name, Description, Price, and Fit are required');
        return;
      }
      
      const finalVariants = formData.variants.length > 0 ? formData.variants : [
           { color: "Standard", color_code: "#000000", sizes: { "S": 10, "M": 10, "L": 10, "XL": 10 } }
      ];

      // Prepare data for API
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined, // Send as undefined if empty
        variants: finalVariants
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
        toast.success('Product updated');
      } else {
        await api.post('/products', productData);
        toast.success('Product created');
      }
      
      setDialogOpen(false); 
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error.response?.data || error);
      toast.error('Failed to save product. Check required fields.');
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
      name: product.name || '',
      description: product.description || '',
      mrp: product.mrp ? product.mrp.toString() : '',
      price: product.price ? product.price.toString() : '',
      fit: product.fit || 'Regular Fit', // ADDED: Read fit
      category: product.category || 'shirts',
      featured: product.featured || false,
      images: product.images || [],
      variants: product.variants || []
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      mrp: '',
      price: '',
      fit: 'Regular Fit', // ADDED: Reset fit
      category: 'shirts',
      featured: false,
      images: [],
      variants: []
    });
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="icon" className="rounded-none border-black hover:bg-black hover:text-white" data-testid="back-btn">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold playfair text-black" data-testid="admin-products-title">Manage Products</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { 
             setDialogOpen(open);
             if(!open) { setEditingProduct(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-none">
                <Plus className="mr-2" size={20} />
                Add Product
              </Button>
            </DialogTrigger>
            {/* MODIFIED: Increased max-w to 4xl and ensured content is scrollable */}
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-none border-black p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="playfair text-3xl">{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-8 py-4">
                
                {/* 1. General Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="rounded-none border-gray-300 focus:border-black"
                      placeholder="E.g., Signature Linen Shirt"
                      required
                    />
                  </div>
                  
                  {/* ADDED: Fit Select Input */}
                  <div>
                    <Label htmlFor="fit">Shirt Fit *</Label>
                    <Select value={formData.fit} onValueChange={(value) => setFormData({...formData, fit: value})}>
                        <SelectTrigger id="fit" className="rounded-none border-gray-300 focus:border-black">
                            <SelectValue placeholder="Select Fit Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Regular Fit">Regular Fit</SelectItem>
                            <SelectItem value="Slim Fit">Slim Fit</SelectItem>
                            <SelectItem value="Relaxed Fit">Relaxed Fit</SelectItem>
                            <SelectItem value="Tailored Fit">Tailored Fit</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input 
                      id="category" 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="rounded-none border-gray-300 focus:border-black"
                      placeholder="e.g., shirts"
                    />
                  </div>
                </div>

                {/* 2. Description */}
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    rows={4}
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="rounded-none border-gray-300 focus:border-black"
                    required
                  />
                </div>

                {/* 3. Pricing Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-b border-gray-100 py-6">
                  <div>
                    <Label htmlFor="price">Sale Price (₹) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="rounded-none border-black text-lg font-medium"
                      placeholder="1999"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP (₹) - Optional</Label>
                    <Input 
                      id="mrp" 
                      type="number" 
                      value={formData.mrp} 
                      onChange={(e) => setFormData({...formData, mrp: e.target.value})}
                      className="rounded-none border-gray-300 focus:border-black"
                      placeholder="2500"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input 
                      type="checkbox" 
                      id="featured" 
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <Label htmlFor="featured" className="ml-2">Mark as Featured</Label>
                  </div>
                </div>
                
                {/* 4. Variants Section */}
                <VariantEditor variants={formData.variants} setVariants={(v) => setFormData({...formData, variants: v})} />

                {/* 5. Images Section */}
                <div>
                  <Label>Images</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4 mt-2">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={img.url} alt="" className="w-full h-full object-cover border border-gray-200" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Stop propagation for nested buttons
                            setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))
                          }}
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
                    label={`Add Images (${formData.images.length} uploaded)`}
                  />
                </div>

                <Button onClick={handleSaveProduct} className="w-full bg-black text-white hover:bg-gray-800 rounded-none py-6">
                  {editingProduct ? 'Update Product' : 'Create Product'}
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
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">MRP</th> 
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 uppercase tracking-wider text-sm">Sale Price</th> 
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
                      <td className="py-4 px-6 text-gray-600">
                        {product.mrp ? `₹${product.mrp.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-4 px-6 font-semibold text-black">
                        ₹{product.price.toFixed(2)}
                      </td>
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
    </div>
  );
};

export default AdminProducts;