import { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Tag, Coffee, Sparkles, 
  Settings2, Search, Check, Save, Layers, HelpCircle, Utensils
} from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { formatCOP } from '../../utils/currency';

export default function Menu() {
  const { 
    categories, products, modifiers, config,
    addCategory, updateCategory, deleteCategory, 
    addProduct, updateProduct, deleteProduct,
    addModifier, updateModifier, deleteModifier,
    updateConfig
  } = usePosStore();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'modifiers' | 'combos'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Form states
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const [prodForm, setProdForm] = useState({ name: '', price: 0, categoryId: '', isActive: true });
  const [modForm, setModForm] = useState({ name: '', priceDelta: 0 });
  const [comboPriceForm, setComboPriceForm] = useState(config?.comboPrice ?? 12000);
  const [comboSavedNotice, setComboSavedNotice] = useState(false);

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

  // --- Modifier (Adiciones) Handlers ---
  const openModifierModal = (mod = null) => {
    if (mod) {
      setEditingModifier(mod.id);
      setModForm({ name: mod.name, priceDelta: mod.priceDelta || 0 });
    } else {
      setEditingModifier(null);
      setModForm({ name: '', priceDelta: 0 });
    }
    setIsModifierModalOpen(true);
  };

  const saveModifier = () => {
    if (!modForm.name) return;
    const data = {
      name: modForm.name.trim(),
      priceDelta: Number(modForm.priceDelta) || 0
    };
    if (editingModifier) {
      updateModifier(editingModifier, data);
    } else {
      addModifier(data);
    }
    setIsModifierModalOpen(false);
  };

  const handleDeleteModifier = (id) => {
    if (window.confirm('¿Deseas eliminar esta adición / modificador?')) {
      deleteModifier(id);
    }
  };

  // --- Combo Config Handler ---
  const handleSaveComboPrice = (e) => {
    e.preventDefault();
    const newPrice = Number(comboPriceForm);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Por favor ingresa un precio válido.');
      return;
    }
    updateConfig({ comboPrice: newPrice });
    setComboSavedNotice(true);
    setTimeout(() => setComboSavedNotice(false), 3000);
  };

  // Filtrados
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredModifiers = (modifiers || []).filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Principal */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Utensils className="text-accent" size={24} /> Gestión de Menú
          </h1>
          <p className="page-subtitle">
            Administra productos, categorías, adiciones y precios de combos para el punto de venta
          </p>
        </div>

        {/* Pestañas Superiores */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
          >
            <Coffee size={16} /> Productos ({products.length})
          </button>
          <button 
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          >
            <Tag size={16} /> Categorías ({categories.length})
          </button>
          <button 
            className={`btn ${activeTab === 'modifiers' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveTab('modifiers'); setSearchQuery(''); }}
          >
            <Sparkles size={16} /> Adiciones / Modificadores ({(modifiers || []).length})
          </button>
          <button 
            className={`btn ${activeTab === 'combos' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveTab('combos'); setSearchQuery(''); }}
          >
            <Settings2 size={16} /> Precio de Combos
          </button>
        </div>
      </div>

      {/* ─── TAB 1: PRODUCTOS ─── */}
      {activeTab === 'products' && (
        <div className="card flex flex-col gap-4 p-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-light pb-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1" style={{ maxWidth: 300 }}>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', width: '100%' }}
                />
              </div>
              <select 
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ maxWidth: 200 }}
              >
                <option value="all">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => openProductModal()}>
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>

          <div className="grid-3">
            {filteredProducts.map(prod => {
              const cat = categories.find(c => c.id === prod.categoryId);
              return (
                <div key={prod.id} className="card p-4 border-light flex flex-col gap-2 hover:border-accent transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{prod.name}</h3>
                      <span className="text-sm text-muted">{cat ? `${cat.icon} ${cat.name}` : 'Sin Categoría'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openProductModal(prod)} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteProduct(prod.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-light">
                    <span className="text-accent font-bold text-lg">{formatCOP(prod.price)}</span>
                    <span className={`badge ${prod.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {prod.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-muted">
              No se encontraron productos que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CATEGORÍAS ─── */}
      {activeTab === 'categories' && (
        <div className="card flex flex-col gap-4 p-4">
          <div className="flex justify-between items-center border-b border-light pb-4">
            <div>
              <h2 className="font-bold text-lg">Categorías del Menú</h2>
              <p className="text-xs text-muted">Organiza tus platos en grupos visibles en la pantalla de pedidos</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => openCategoryModal()}>
              <Plus size={16} /> Nueva Categoría
            </button>
          </div>

          <div className="grid-3">
            {categories.map(cat => (
              <div key={cat.id} className="card p-4 border-light flex justify-between items-center hover:border-accent transition">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <span className="font-bold block text-base">{cat.name}</span>
                    <span className="text-xs text-muted">
                      {products.filter(p => p.categoryId === cat.id).length} productos
                    </span>
                  </div>
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
          {categories.length === 0 && (
            <div className="text-center py-8 text-muted">No hay categorías registradas. Crea la primera.</div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ADICIONES / MODIFICADORES ─── */}
      {activeTab === 'modifiers' && (
        <div className="card flex flex-col gap-4 p-4">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-light pb-4">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-accent" /> Adiciones y Modificadores de Pedido
              </h2>
              <p className="text-xs text-muted">
                Opciones que los meseros pueden marcar al tomar un pedido (ej. "Extra Tocino", "Sin Cebolla", "Término 3/4").
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" style={{ minWidth: 220 }}>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text"
                  placeholder="Buscar adición..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', width: '100%' }}
                />
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => openModifierModal()}>
                <Plus size={16} /> Nueva Adición / Modificador
              </button>
            </div>
          </div>

          <div className="grid-3">
            {filteredModifiers.map(mod => (
              <div 
                key={mod.id} 
                className="card p-4 border-light flex justify-between items-center hover:border-accent transition"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div>
                  <h4 className="font-bold text-base">{mod.name}</h4>
                  <div className="mt-1">
                    {mod.priceDelta > 0 ? (
                      <span className="badge badge-warning font-bold">
                        +{formatCOP(mod.priceDelta)}
                      </span>
                    ) : (
                      <span className="badge badge-secondary text-xs">
                        Sin costo adicional ($0)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="btn btn-ghost btn-sm btn-icon" 
                    onClick={() => openModifierModal(mod)}
                    title="Editar modificador"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="btn btn-danger btn-sm btn-icon" 
                    onClick={() => handleDeleteModifier(mod.id)}
                    title="Eliminar modificador"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredModifiers.length === 0 && (
            <div className="text-center py-10 text-muted">
              No hay adiciones ni modificadores que coincidan con la búsqueda.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: CONFIGURACIÓN DE PRECIO DE COMBOS ─── */}
      {activeTab === 'combos' && (
        <div className="card p-6 flex flex-col gap-6" style={{ maxWidth: 720 }}>
          <div className="border-b border-light pb-4">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <Settings2 className="text-accent" size={22} /> Configuración de Combos Dinámicos
            </h2>
            <p className="text-sm text-muted mt-1">
              Define el valor que se cobra automáticamente al convertir una hamburguesa u otro producto principal en combo en el módulo de ventas.
            </p>
          </div>

          <form onSubmit={handleSaveComboPrice} className="flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label font-bold text-base">
                Precio Adicional por Convertir en Combo (COP) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)' }}>$</span>
                <input 
                  type="number"
                  className="form-input text-lg font-bold"
                  value={comboPriceForm}
                  onChange={(e) => setComboPriceForm(e.target.value)}
                  min="0"
                  step="500"
                  required
                  style={{ width: '100%', color: 'var(--accent)' }}
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Este valor se sumará al producto base e incluirá la selección obligatoria de 1 Acompañamiento y 1 Bebida.
              </p>
            </div>

            {/* Simulador / Preview */}
            <div 
              className="card p-4 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <h4 className="font-bold text-sm text-secondary uppercase mb-3 flex items-center gap-2">
                <HelpCircle size={15} /> Ejemplo de Cálculo en POS:
              </h4>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Hamburguesa Classic Burger (Base):</span>
                  <span className="font-bold">{formatCOP(19900)}</span>
                </div>
                <div className="flex justify-between text-accent">
                  <span>+ Recargo de Combo configurado:</span>
                  <span className="font-bold">+{formatCOP(Number(comboPriceForm) || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-light pt-2 text-base font-extrabold">
                  <span>Total Combo (con papas y bebida a elección):</span>
                  <span className="text-accent">{formatCOP(19900 + (Number(comboPriceForm) || 0))}</span>
                </div>
              </div>
            </div>

            {comboSavedNotice && (
              <div className="badge badge-success p-3 flex items-center gap-2 justify-center text-sm font-bold">
                <Check size={18} /> ¡Precio del combo actualizado correctamente!
              </div>
            )}

            <div className="flex justify-start">
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Save size={16} /> Guardar Precio de Combo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL DE CATEGORÍA ─── */}
      {isCategoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Nombre de la Categoría *</label>
                <input 
                  className="form-input w-full" 
                  value={catForm.name} 
                  onChange={e => setCatForm({...catForm, name: e.target.value})} 
                  placeholder="Ej: Hamburguesas"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Icono (Emoji)</label>
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

      {/* ─── MODAL DE PRODUCTO ─── */}
      {isProductModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Nombre del Producto *</label>
                <input 
                  className="form-input w-full" 
                  value={prodForm.name} 
                  onChange={e => setProdForm({...prodForm, name: e.target.value})} 
                  placeholder="Ej: Hamburguesa Sencilla"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select 
                  className="form-select w-full" 
                  value={prodForm.categoryId || ''} 
                  onChange={e => setProdForm({...prodForm, categoryId: e.target.value})}
                  required
                >
                  <option value="" disabled>Selecciona una...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio de Venta en COP *</label>
                <input 
                  type="number"
                  className="form-input w-full" 
                  value={prodForm.price === 0 ? '' : prodForm.price} 
                  onChange={e => setProdForm({...prodForm, price: e.target.value})} 
                  placeholder="Ej: 22900"
                  required
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  checked={prodForm.isActive} 
                  onChange={e => setProdForm({...prodForm, isActive: e.target.checked})}
                  id="isActiveCheck"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-bold cursor-pointer">
                  Producto Activo (Visible en el POS)
                </label>
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setIsProductModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveProduct} disabled={!prodForm.name || !prodForm.categoryId}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE ADICIÓN / MODIFICADOR ─── */}
      {isModifierModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingModifier ? '✏️ Editar Adición / Modificador' : '➕ Nueva Adición / Modificador'}</h2>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Nombre del Modificador / Adición *</label>
                <input 
                  className="form-input w-full" 
                  value={modForm.name} 
                  onChange={e => setModForm({...modForm, name: e.target.value})} 
                  placeholder="Ej: Extra Queso Cheddar, Sin Cebolla, Término 3/4..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Precio Adicional (COP)</label>
                <input 
                  type="number"
                  className="form-input w-full" 
                  value={modForm.priceDelta} 
                  onChange={e => setModForm({...modForm, priceDelta: e.target.value})} 
                  placeholder="0 para gratis o exclusión (ej. Sin Tomate)"
                  min="0"
                  step="500"
                />
                <p className="text-xs text-muted mt-1">
                  Pon <strong>0</strong> si es una preferencia sin costo (ej: "Sin cebolla", "Término medio"). Pon un valor (ej: <strong>2500</strong>) si es una adición con costo extra.
                </p>
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setIsModifierModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveModifier} disabled={!modForm.name.trim()}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
