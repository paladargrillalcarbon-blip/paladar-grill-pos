import { useState, useMemo } from 'react';
import { Plus, Trash2, BookOpen, ChevronRight, X, Save, FlaskConical } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { formatCOP } from '../../utils/currency';

export default function Recipes() {
  const { products, categories, updateProduct } = usePosStore();
  const { ingredients } = useInventoryStore();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Recipe editor state (copy of selected product's ingredients)
  const [recipeLines, setRecipeLines] = useState([]);
  const [addIngId, setAddIngId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [dirty, setDirty] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products.filter(p => p.isActive);
    return products.filter(p => p.categoryId === activeCategory && p.isActive);
  }, [products, activeCategory]);

  const costOfRecipe = useMemo(() => {
    return recipeLines.reduce((total, line) => {
      const ing = ingredients.find(i => i.id === line.ingredientId);
      return total + (ing?.costPerUnit || 0) * line.quantity;
    }, 0);
  }, [recipeLines, ingredients]);

  const openEditor = (product) => {
    setSelectedProduct(product);
    setRecipeLines(
      (product.ingredients || []).map(l => ({ ...l }))
    );
    setAddIngId('');
    setAddQty('');
    setDirty(false);
  };

  const handleAddLine = () => {
    if (!addIngId || !addQty || Number(addQty) <= 0) return;
    if (recipeLines.find(l => l.ingredientId === addIngId)) {
      // Update existing
      setRecipeLines(prev =>
        prev.map(l => l.ingredientId === addIngId
          ? { ...l, quantity: l.quantity + Number(addQty) }
          : l
        )
      );
    } else {
      setRecipeLines(prev => [...prev, { ingredientId: addIngId, quantity: Number(addQty) }]);
    }
    setAddIngId('');
    setAddQty('');
    setDirty(true);
  };

  const handleChangeLine = (ingredientId, qty) => {
    setRecipeLines(prev =>
      prev.map(l => l.ingredientId === ingredientId ? { ...l, quantity: Number(qty) } : l)
    );
    setDirty(true);
  };

  const handleRemoveLine = (ingredientId) => {
    setRecipeLines(prev => prev.filter(l => l.ingredientId !== ingredientId));
    setDirty(true);
  };

  const handleSave = () => {
    if (!selectedProduct) return;
    updateProduct(selectedProduct.id, { ingredients: recipeLines });
    setDirty(false);
    // Refresh local copy
    setSelectedProduct(prev => ({ ...prev, ingredients: recipeLines }));
    alert('✅ Receta guardada. El inventario se descontará automáticamente al vender este producto.');
  };

  const handleClose = () => {
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) return;
    setSelectedProduct(null);
    setDirty(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recetas y Costeo</h1>
          <p className="page-subtitle">
            Asocia ingredientes a cada plato — el inventario se descuenta automáticamente al vender
          </p>
        </div>
      </div>

      {/* Filtro de categoría */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveCategory('all')}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="grid-3">
        {filteredProducts.map(product => {
          const cat = categories.find(c => c.id === product.categoryId);
          const ingCount = (product.ingredients || []).length;
          const cost = (product.ingredients || []).reduce((total, line) => {
            const ing = ingredients.find(i => i.id === line.ingredientId);
            return total + (ing?.costPerUnit || 0) * line.quantity;
          }, 0);
          const margin = product.price > 0 ? (((product.price - cost) / product.price) * 100).toFixed(0) : 0;

          return (
            <div
              key={product.id}
              className="card p-4 border-light flex flex-col gap-2 cursor-pointer hover:border-accent transition"
              style={{ border: selectedProduct?.id === product.id ? '2px solid var(--accent)' : '' }}
              onClick={() => openEditor(product)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                  <span className="text-sm text-muted">{cat ? `${cat.icon} ${cat.name}` : ''}</span>
                </div>
                <ChevronRight size={18} className="text-muted mt-1" />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border mt-1">
                <div>
                  <div className="text-accent font-bold">{formatCOP(product.price)}</div>
                  {cost > 0 && (
                    <div className="text-xs text-muted mt-0.5">
                      Costo: {formatCOP(cost)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {ingCount > 0 ? (
                    <>
                      <span className="badge badge-success">{ingCount} ingredientes</span>
                      {cost > 0 && (
                        <div className={`text-xs font-bold mt-1 ${Number(margin) >= 50 ? 'text-success' : Number(margin) >= 30 ? 'text-warning' : 'text-danger'}`}>
                          Margen: {margin}%
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="badge badge-danger">Sin receta</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted">
            <div className="text-4xl mb-3">🍽️</div>
            <div>No hay productos en esta categoría.</div>
          </div>
        )}
      </div>

      {/* Modal Editor de Receta */}
      {selectedProduct && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  <FlaskConical size={18} className="inline mr-2 text-accent" />
                  Receta: {selectedProduct.name}
                </h2>
                <p className="text-sm text-muted mt-1">
                  Precio de venta: <strong>{formatCOP(selectedProduct.price)}</strong>
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={handleClose}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body flex flex-col gap-4">

              {/* Agregar ingrediente */}
              <div className="card p-3 border-light flex flex-col gap-2">
                <div className="text-sm font-bold text-muted uppercase">Agregar ingrediente</div>
                <div className="flex gap-2">
                  <select
                    className="form-select flex-1"
                    value={addIngId}
                    onChange={e => setAddIngId(e.target.value)}
                  >
                    <option value="">Selecciona un insumo...</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) — Stock: {ing.stock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    style={{ width: 90 }}
                    value={addQty}
                    onChange={e => setAddQty(e.target.value)}
                    placeholder="Cant."
                  />
                  <button
                    className="btn btn-primary btn-icon"
                    onClick={handleAddLine}
                    disabled={!addIngId || !addQty || Number(addQty) <= 0}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Tabla de ingredientes de la receta */}
              {recipeLines.length === 0 ? (
                <div className="text-center py-8 text-muted border border-dashed border-border rounded-lg">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                  <div>Este plato no tiene ingredientes.</div>
                  <div className="text-xs mt-1">Agrega ingredientes arriba para configurar la receta.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-bold text-muted uppercase mb-1">Ingredientes de la receta</div>
                  {recipeLines.map(line => {
                    const ing = ingredients.find(i => i.id === line.ingredientId);
                    if (!ing) return null;
                    const lineCost = (ing.costPerUnit || 0) * line.quantity;
                    return (
                      <div
                        key={line.ingredientId}
                        className="flex items-center gap-3 p-2 rounded-lg border border-border"
                        style={{ background: 'var(--surface)' }}
                      >
                        <div className="flex-1">
                          <div className="font-bold text-sm">{ing.name}</div>
                          <div className="text-xs text-muted">{formatCOP(ing.costPerUnit || 0)} / {ing.unit}</div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-input"
                          style={{ width: 80 }}
                          value={line.quantity}
                          onChange={e => handleChangeLine(line.ingredientId, e.target.value)}
                        />
                        <span className="text-xs text-muted w-16 text-center">{ing.unit}</span>
                        <span className="text-sm font-bold text-accent w-24 text-right">{formatCOP(lineCost)}</span>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleRemoveLine(line.ingredientId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resumen de costos */}
              {recipeLines.length > 0 && (
                <div className="card p-3 border-light">
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted">Costo total de ingredientes</span>
                    <span className="font-bold">{formatCOP(costOfRecipe)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted">Precio de venta</span>
                    <span className="font-bold">{formatCOP(selectedProduct.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-t border-border mt-1 pt-2">
                    <span className="font-bold">Utilidad bruta por plato</span>
                    <span className={`font-extrabold text-lg ${selectedProduct.price - costOfRecipe >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCOP(selectedProduct.price - costOfRecipe)}
                    </span>
                  </div>
                  {selectedProduct.price > 0 && (
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-muted">Margen de utilidad</span>
                      <span className={`font-bold ${
                        ((selectedProduct.price - costOfRecipe) / selectedProduct.price * 100) >= 50 ? 'text-success' :
                        ((selectedProduct.price - costOfRecipe) / selectedProduct.price * 100) >= 30 ? 'text-warning' : 'text-danger'
                      }`}>
                        {((selectedProduct.price - costOfRecipe) / selectedProduct.price * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!dirty}
              >
                <Save size={16} /> Guardar Receta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
