import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ArrowLeft, X, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import FileUpload from '../../components/FileUpload';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminProducts = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'shirts',
    featured: false,
    images: [],
    variants: [{ color: 'White', color_code: '#FFFFFF', sizes: { S: 10, M: 15, L: 20, XL: 10, XXL: 5 } }]
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }
    
    if (formData.images.length === 0) {
      toast.error('At least one product image is required');
      return;
    }
    
    // Check if all variants have names and at least one size with stock > 0
    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      if (!variant.color.trim()) {
        toast.error(`Color name is required for variant ${i + 1}`);
        return;
      }
      
      const hasStock = Object.values(variant.sizes).some(stock => stock > 0);
      if (!hasStock) {
        toast.error(`Variant "${variant.color}" must have at least one size with stock > 0`);
        return;
      }
    }
    
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'shirts',
      featured: false,
      images: [],
      variants: [{ color: 'White', color_code: '#FFFFFF', sizes: { S: 10, M: 15, L: 20, XL: 10, XXL: 5 } }]
    });
    setEditingProduct(null);
    setActiveTab('basic');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      featured: product.featured,
      images: product.images || [],
      variants: product.variants || [{ color: 'White', color_code: '#FFFFFF', sizes: { S: 10, M: 15, L: 20, XL: 10, XXL: 5 } }]
    });
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { color: '', color_code: '#000000', sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } }]
    });
  };

  const removeVariant = (index) => {
    if (formData.variants.length === 1) {
      toast.error('At least one color variant is required');
      return;
    }
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariantSize = (variantIndex, size, stock) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].sizes[size] = parseInt(stock) || 0;
    setFormData({ ...formData, variants: newVariants });
  };

  const handleImageUpload = (files) => {
    const imageArray = Array.isArray(files) ? files : [files];
    setFormData({
      ...formData,
      images: imageArray.map(file => ({ url: file.data, alt: formData.name || 'Product image' }))
    });
  };

  const getTotalStock = (variants) => {
    return variants.reduce((total, variant) => {
      return total + Object.values(variant.sizes).reduce((sum, stock) => sum + stock, 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="icon" data-testid="back-btn">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold playfair" data-testid="admin-products-title">Manage Products</h1>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={resetForm} data-testid="add-product-btn">
                <Plus size={20} className="mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="variants">Colors & Stock</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                  <TabsContent value="basic" className="space-y-4">
                    <div>
                      <Label>Product Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Classic Cotton Shirt"
                        required
                        data-testid="product-name-input"
                      />
                    </div>
                    
                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Premium 100% cotton shirt with perfect fit..."
                        rows={4}
                        required
                        data-testid="product-desc-input"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price (₹) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="1299"
                          required
                          data-testid="product-price-input"
                        />
                      </div>
                      
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="shirts"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        data-testid="product-featured-checkbox"
                      />
                      <Label htmlFor="featured">Featured Product (show on homepage)</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4">
                    <div>
                      <Label>Product Images *</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload multiple high-quality images. First image will be the main display image.
                      </p>
                      <FileUpload
                        onUpload={handleImageUpload}
                        accept="image/*"
                        multiple={true}
                        maxSize={5}
                        label="Upload Product Images"
                      />
                      {formData.images.length > 0 && (
                        <div className="mt-4 text-sm text-emerald-600">
                          ✓ {formData.images.length} image(s) uploaded
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="variants" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Color Variants & Stock</Label>
                        <p className="text-sm text-gray-600">Add different colors and set stock for each size</p>
                      </div>
                      <Button type="button" onClick={addVariant} variant="outline" size="sm">
                        <Plus size={16} className="mr-2" />
                        Add Color
                      </Button>
                    </div>
                    
                    <div className="space-y-6">
                      {formData.variants.map((variant, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Color Variant {index + 1}</h3>
                            {formData.variants.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeVariant(index)}
                              >
                                <X size={16} />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label>Color Name *</Label>
                              <Input
                                value={variant.color}
                                onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                placeholder="White, Navy, Black..."
                              />
                            </div>
                            
                            <div>
                              <Label>Color Code *</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={variant.color_code}
                                  onChange={(e) => updateVariant(index, 'color_code', e.target.value)}
                                  className="w-16 h-10"
                                />
                                <Input
                                  value={variant.color_code}
                                  onChange={(e) => updateVariant(index, 'color_code', e.target.value)}
                                  placeholder="#FFFFFF"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Stock by Size</Label>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                              {Object.entries(variant.sizes).map(([size, stock]) => (
                                <div key={size} className="text-center">
                                  <Label className="text-sm font-semibold">{size}</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => updateVariantSize(index, size, e.target.value)}
                                    className="text-center mt-1"
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="text-sm text-gray-600 mt-2">
                              Total stock for this color: {Object.values(variant.sizes).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0)} units
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <Palette size={20} />
                        <span className="font-semibold">Total Product Stock</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600 mt-1">
                        {getTotalStock(formData.variants)} units across all variants
                      </div>
                    </div>
                  </TabsContent>

                  <div className="flex gap-4 mt-6 pt-4 border-t">
                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" data-testid="save-product-btn">
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="products-list">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                data-testid={`product-card-${index}`}
              >
                <div className="relative">
                  <img
                    src={product.images[0]?.url || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {product.featured && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-semibold">
                    {getTotalStock(product.variants)} in stock
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 playfair">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <p className="text-2xl font-bold text-emerald-600 mb-3">₹{product.price}</p>
                  
                  <div className="mb-4">
                    <div className="flex gap-1 mb-2">
                      {product.variants?.slice(0, 4).map((variant, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: variant.color_code }}
                          title={variant.color}
                        />
                      ))}
                      {product.variants?.length > 4 && (
                        <div className="text-xs text-gray-500 flex items-center ml-2">
                          +{product.variants.length - 4} more
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.variants?.length} color{product.variants?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                      data-testid={`edit-btn-${index}`}
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="flex-1"
                      data-testid={`delete-btn-${index}`}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
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

export default AdminProducts;