import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import * as productApi from '../api/products';

interface Product {
  _id: string;
  name: string;
  nameHindi?: string;
  size?: string;
  color?: string;
  weight?: number;
  weightUnit?: 'gram' | 'kg';
  description?: string;
  price: number;
  category: string;
  stock?: number;
  images?: string[];
  isActive: boolean;
}

export default function Products() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOriginalImages, setEditingOriginalImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    nameHindi: '',
    size: '',
    color: '',
    weight: '',
    weightUnit: 'gram' as 'gram' | 'kg',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [] as string[],
  });

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

  const isLikelyImage = (s?: string) => {
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return true;
    if (/^\/uploads|^uploads\//i.test(s)) return true;
    // file name or path with common image extension
    if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
    return false;
  };

  const resolveImageSrc = (src?: string) => {
    if (!src) return '';
    if (!isLikelyImage(src)) return '';
    if (!src) return '';

    // If absolute URL, but points to a different host (e.g., Vite dev host),
    // rewrite to use API_BASE when the path looks like /uploads/...
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const u = new URL(src);
        const apiOrigin = new URL(API_BASE).origin;
        if (u.pathname.startsWith('/uploads') && u.origin !== apiOrigin) {
          return `${API_BASE}${u.pathname}`;
        }
        return src;
      } catch (e) {
        return src; // fall back if malformed
      }
    }

    // If the path already includes uploads (with or without leading slash),
    // ensure we prefix with API_BASE and keep a single leading slash.
    if (src.startsWith('/uploads') || src.startsWith('uploads/')) {
      const pathOnly = src.startsWith('/') ? src : '/' + src;
      return `${API_BASE}${pathOnly}`;
    }

    // If it's just a filename (e.g. 'abc.jpg'), assume it's stored in uploads folder
    if (!src.includes('/')) {
      return `${API_BASE}/uploads/${src}`;
    }

    // As a fallback, prefix API_BASE so absolute resolution happens
    return `${API_BASE}${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, originalSrc?: string) => {
    const img = e.currentTarget as HTMLImageElement & { dataset: any };
    try {
      // Try 1: if original is relative (/uploads/...), prefix API_BASE
      if (!img.dataset.tried && originalSrc) {
        img.dataset.tried = '1';
        const fallback = `${API_BASE}${originalSrc.startsWith('/') ? '' : '/'}${originalSrc}`;
        if (fallback !== img.src) { img.src = fallback; return; }
      }

      // Try 2: use basename in uploads folder
      if (!img.dataset.tried2 && originalSrc) {
        img.dataset.tried2 = '1';
        const parts = originalSrc.split('/');
        const basename = parts[parts.length - 1];
        const fallback2 = `${API_BASE}/uploads/${basename}`;
        if (fallback2 !== img.src) { img.src = fallback2; return; }
      }

      // Final: hide the broken image to avoid broken icon
      img.style.display = 'none';
    } catch (err) {
      img.style.display = 'none';
    }
  };

  // API client is used (token handled centrally)

  useEffect(() => {
    fetchProducts(page, limit);
  }, [page, limit]);

  const fetchProducts = async (p = 1, lim = 10) => {
    try {
      try {
        const data = await productApi.getProducts({ page: p, limit: lim, search: searchTerm || undefined });
        if (data.success) {
          setProducts(data.data.products || []);
          // when page changes, clear selection so Delete-selected only appears when user explicitly selects
          setSelected([]);
          const pag = data.data.pagination || {};
          setTotalPages(pag.pages || 1);
          setTotalCount(pag.total || 0);
        }
      } catch (err: any) {
        if (err.message === 'unauthorized') {
          alert('Session expired. Please login again.');
          logout();
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw err;
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      alert('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // call fetchProducts when search changes (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchProducts(1, limit);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      try {
        const payload = {
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock) || 0,
          weight: formData.weight ? Number(formData.weight) : undefined,
          size: formData.size || undefined,
          color: formData.color || undefined,
          weightUnit: formData.weight ? formData.weightUnit : undefined,
        };

        let data;
        if (editingProduct) {
            // detect images deleted during edit so backend can remove files
            const orig = editingOriginalImages || [];
            const keep = payload.images || [];
            const deletedImages = orig.filter(i => !keep.includes(i));
            data = await productApi.updateProduct(editingProduct._id, { ...payload, deletedImages });
        } else {
          data = await productApi.createProduct(payload as any);
        }

        if (data.success) {
          setShowModal(false);
          setEditingProduct(null);
          setFormData({
            name: '',
            nameHindi: '',
            size: '',
            color: '',
            weight: '',
            weightUnit: 'gram',
            description: '',
            price: '',
            category: '',
            stock: '',
            images: [],
          });
          fetchProducts();
          try { window.dispatchEvent(new CustomEvent('socket:update-overview', { detail: { type: 'product' } })); } catch (e) {}
        } else {
          alert(data.message || 'Failed to save product');
        }
      } catch (err: any) {
        if (err.message === 'unauthorized') {
          alert('Session expired. Please login again.');
          logout();
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        console.error('Failed to save product:', err);
        alert('Failed to save product. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameHindi: product.nameHindi || '',
      size: product.size || '',
      color: product.color || '',
      weight: product.weight?.toString() || '',
      weightUnit: product.weightUnit || 'gram',
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      stock: product.stock?.toString() || '',
      images: product.images || [],
    });
    setEditingOriginalImages(product.images || []);
    setShowModal(true);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelected(filteredProducts.map(p => p._id));
    else setSelected([]);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return alert('No products selected');
    if (!confirm(`Delete ${selected.length} products? This is permanent.`)) return;
    try {
      for (const id of selected) {
        await productApi.deleteProduct(id);
      }
      setSelected([]);
      fetchProducts(page, limit);
      try { window.dispatchEvent(new CustomEvent('socket:update-overview', { detail: { type: 'product' } })); } catch (e) {}
    } catch (err: any) {
      console.error('Bulk delete error', err);
      alert('Failed to delete selected products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

      try {
        const data = await productApi.deleteProduct(id);
        if (data.success) {
          fetchProducts();
          try { window.dispatchEvent(new CustomEvent('socket:update-overview', { detail: { type: 'product' } })); } catch (e) {}
        } else {
          alert(data.message || 'Failed to delete product');
        }
      } catch (err: any) {
        if (err.message === 'unauthorized') {
          alert('Session expired. Please login again.');
          logout();
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        console.error('Failed to delete product:', err);
        alert('Failed to delete product. Please try again.');
      }
  };

  const handleBulkUploadFile = async (file: File | null) => {
    if (!file) return;
    setBulkUploading(true);
    try {
      const text = await file.text();
      const data = await productApi.bulkUploadCsv(text);
        if (data.success) {
        // go to first page so newly uploaded products are visible
        setPage(1);
        alert(`Inserted: ${data.inserted} products`);
        fetchProducts(1, limit);
        setShowBulkModal(false);
        try { window.dispatchEvent(new CustomEvent('socket:update-overview', { detail: { type: 'product' } })); } catch (e) {}
      } else {
        alert(data.message || 'Bulk upload failed');
      }
    } catch (err: any) {
      console.error('Bulk upload error', err);
      alert('Bulk upload error: ' + (err.message || err));
    } finally {
      setBulkUploading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <div className="flex items-center gap-3">
              <button
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  name: '',
                  nameHindi: '',
                  size: '',
                  color: '',
                  weight: '',
                  weightUnit: 'gram',
                  description: '',
                  price: '',
                  category: '',
                  stock: '',
                  images: [],
                });
                setShowModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <span className="mr-2">+</span> Add Product
            </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Bulk Upload (CSV)
              </button>
              {selected.length > 1 && (
                <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">Delete selected ({selected.length})</button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Products Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No products found. Click "Add Product" to create your first product.
              </div>
            ) : (
              <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" onChange={(e) => toggleSelectAll(e.target.checked)} checked={selected.length > 0 && selected.length === filteredProducts.length} />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" checked={selected.includes(product._id)} onChange={() => toggleSelect(product._id)} />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                              <div className="flex items-center gap-3">
                                        {product.images && product.images.length > 0 && resolveImageSrc(product.images[0]) ? (
                                                  <img src={resolveImageSrc(product.images[0])} alt={product.name} className="w-14 h-14 object-cover rounded-lg shadow-sm" onError={(e) => handleImageError(e, product.images?.[0])} />
                                        ) : (
                                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">No</div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </div>
                              </div>
                          {product.nameHindi && (
                            <div className="text-sm text-gray-500">{product.nameHindi}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>₹{product.price.toLocaleString()}</div>
                          {(product.size || product.color || product.weight) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.size && <span className="mr-2">Size: {product.size}</span>}
                              {product.color && <span className="mr-2">Color: {product.color}</span>}
                              {product.weight && <span>Weight: {product.weight}{product.weightUnit}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 flex items-center justify-between border-t">
                <div className="text-sm text-gray-600">Showing page {page} of {totalPages} — {totalCount} products</div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border rounded text-sm">Prev</button>
                  <div className="text-sm px-2">{page}</div>
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border rounded text-sm">Next</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-2 py-1 border rounded text-sm">Last</button>
                  <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="border border-gray-200 rounded px-2 py-1 text-sm ml-2">
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Smart Watch"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Electronics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>

                {/* Product Attributes: Size / Color / Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Red, Blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="100"
                    />
                    <select
                      value={formData.weightUnit}
                      onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value as 'gram' | 'kg' })}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="gram">gram</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Move Images to the bottom of the modal so other product fields are primary */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                <input type="file" accept="image/*" multiple onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const arr = Array.from(files);
                  const uploaded: string[] = [];
                  for (const f of arr) {
                    try {
                      const { uploadImage } = await import('../api/uploads');
                      const r: any = await uploadImage(f);
                      if (r.success && r.data?.url) uploaded.push(r.data.url);
                    } catch (err) { console.error('Image upload failed', err); }
                  }
                  setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...uploaded] }));
                }} />
                {formData.images && formData.images.length > 0 && (
                  <div className="mt-3 flex gap-3">
                    {formData.images.filter(s => resolveImageSrc(s)).map((src, idx) => (
                      <div key={idx} className="relative">
                        <img src={resolveImageSrc(src)} alt="product" className="w-20 h-20 object-cover rounded-lg shadow-sm" onError={(e) => handleImageError(e, src ?? undefined)} />
                        <button type="button" onClick={() => {
                          setFormData(prev => ({ ...prev, images: prev.images?.filter(x => x !== src) || [] }));
                        }} className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* (attributes moved earlier) - removed duplicate block */}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Bulk Upload Products (CSV)</h2>
            <div className="text-sm text-gray-700 mb-4">
              Upload a CSV with headers: name, nameHindi, description, price, category, stock, size, color, weight, weightUnit (gram/kg), images (semicolon separated).<br />
              <span className="text-green-700 font-semibold">Optional: `variants` are supported as a semicolon-separated list where each variant is specified as <code>name:price</code> (e.g. <em>Small:9.99;Large:12.99</em>).</span>
            </div>
            <input type="file" accept="text/csv,text/plain" onChange={(e) => handleBulkUploadFile(e.target.files?.[0] || null)} disabled={bulkUploading} />
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" disabled={bulkUploading} onClick={() => { /* no-op, file input handles upload */ }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">{bulkUploading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

