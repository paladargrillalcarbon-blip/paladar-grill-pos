import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Coffee } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { formatCOP } from '../../utils/currency';

export default function Menu() {
  const { categories, products, addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct } = usePosStore();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'

  // Modals state
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form states
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const [prodForm, setProdForm] = useState({ name: '', price: 0, categoryId: '', isActive: true });

  // --- Category Handlers ---
  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat.id);
      setCatForm({ name: cat.name, icon: cat.icon || '' });
    } else {
      setEditingCategory(null);
      setCatForm({ name: '', icon: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const saveCategory = () => {
    if (!catForm.name) return;
    if (editingCategory) {
      updateCategory(editingCategory, catForm);
    } else {
      addCategory({ ...catForm, sortOrder: categories.length });
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta categoría? Los productos de esta categoría quedarán sin categoría asignada.')) {
      deleteCategory(id);
    }
  };

  // --- Product Handlers ---
  const openProductModal = (prod = null) => {
    if (categories.length === 0) {
      alert("Debes crear al menos una categoría primero antes de agregar productos.");
      setActiveTab('categories');
      return;
    }
    if (prod) {
      setEditingProduct(prod.id);
      // Validar si la categoría del producto aún existe, si no, seleccionar la primera disponible
      const categoryExists = categories.some(c => c.id === prod.categoryId);
      setProdForm({ 
        name: prod.name, 
        price: prod.price, 
        categoryId: categoryExists ? prod.categoryId : categories[0].id, 
        isActive: prod.isActive 
      });
    } else {
      setEditingProduct(null);
      setProdForm({ name: '', price: 0, categoryId: categories[0]?.id || '', isActive: true });
    }
    setIsProductModalOpen(true);
  };

  const saveProduct = () => {
    if (!prodForm.name || !prodForm.categoryId) return;
    if (editingProduct) {
      updateProduct(editingProduct, { ...prodForm, price: Number(prodForm.price) });
    } else {
      addProduct({ ...prodForm, price: Number(prodForm.price) });
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('¿Eliminar producto?')) {
      deleteProduct(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Menú</h1>
          <p className="page-subtitle">Administra tus productos y categorías</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tag size={16} /> Categorías
          </button>
          <button 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('products')}
          >
            <Coffee size={16} /> Productos
          </button>
        </div>
      </div>

      {activeTab === 'categories' && (
        <div className="card">
          <div className="card-header flex justify-between items-center p-4 border-b border-light">
            <h2 className="font-bold text-lg">Categorías del Menú</h2>
            <button className="btn btn-primary btn-sm" onClick={() => openCategoryModal()}>
              <Plus size={16} /> Nueva Categoría
            </button>
          </div>
          <div className="p-4">
            <div className="grid-3">
              {categories.map(cat => (
                <div key={cat.id} className="card p-4 border-light flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="font-bold">{cat.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openCategoryModal(cat)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteCategory(cat.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {categories.length === 0 && <div className="text-center py-8 text-muted">No hay categorías. Crea la primera.</div>}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="card">
          <div className="card-header flex justify-between items-center p-4 border-b border-light">
            <h2 className="font-bold text-lg">Productos</h2>
            <button className="btn btn-primary btn-sm" onClick={() => openProductModal()}>
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>
          <div className="p-4">
            <div className="grid-3">
              {products.map(prod => {
                const cat = categories.find(c => c.id === prod.categoryId);
                return (
                  <div key={prod.id} className="card p-4 border-light flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{prod.name}</h3>
                        <span className="text-sm text-muted">{cat ? `${cat.icon} ${cat.name}` : 'Sin Categoría'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openProductModal(prod)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteProduct(prod.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-accent font-bold text-lg">{formatCOP(prod.price)}</span>
                      <span className={`badge ${prod.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {prod.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {products.length === 0 && <div className="text-center py-8 text-muted">No hay productos.</div>}
          </div>
        </div>
      )}

      {/* --- MODALES --- */}
      {isCategoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre de la Categoría</label>
                <input 
                  className="form-input w-full" 
                  value={catForm.name} 
                  onChange={e => setCatForm({...catForm, name: e.target.value})} 
                  placeholder="Ej: Hamburguesas"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Icono (Emoji)</label>
                <input 
                  className="form-input w-full" 
                  value={catForm.icon} 
                  onChange={e => setCatForm({...catForm, icon: e.target.value})} 
                  placeholder="Ej: 🍔"
                />
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveCategory} disabled={!catForm.name}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre</label>
                <input 
                  className="form-input w-full" 
                  value={prodForm.name} 
                  onChange={e => setProdForm({...prodForm, name: e.target.value})} 
                  placeholder="Ej: Hamburguesa Sencilla"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Categoría</label>
                <select 
                  className="form-select w-full" 
                  value={prodForm.categoryId || ''} 
                  onChange={e => setProdForm({...prodForm, categoryId: e.target.value})}
                >
                  <option value="" disabled>Selecciona una...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Precio de Venta (COP)</label>
                <input 
                  type="number"
                  className="form-input w-full" 
                  value={prodForm.price === 0 ? '' : prodForm.price} 
                  onChange={e => setProdForm({...prodForm, price: e.target.value})} 
                  placeholder="Ej: 15000"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={prodForm.isActive} 
                  onChange={e => setProdForm({...prodForm, isActive: e.target.checked})}
                  id="isActiveCheck"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-bold">Producto Activo (Visible en POS)</label>
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setIsProductModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={!prodForm.name || !prodForm.categoryId}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
