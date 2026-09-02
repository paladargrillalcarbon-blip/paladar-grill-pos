import { useState, useMemo } from 'react';
import { X, Check, Plus, Minus, Sparkles, Tag, AlertCircle } from 'lucide-react';
import { formatCOP } from '../../utils/currency';
import { usePosStore } from '../../store/posStore';

export default function ProductCustomizerModal({ product, onClose, onConfirm }) {
  const { products, modifiers, config } = usePosStore();
  const comboPrice = config?.comboPrice ?? 12000;

  const [isCombo, setIsCombo] = useState(false);
  const [selectedSide, setSelectedSide] = useState('');
  const [selectedDrink, setSelectedDrink] = useState('');
  
  // Guardamos los ids de los modificadores seleccionados
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [specialNote, setSpecialNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Filtrar Acompañamientos y Bebidas
  const sides = useMemo(() => (products || []).filter(p => p.categoryId === 'cat-4' && p.isActive), [products]);
  const drinks = useMemo(() => (products || []).filter(p => p.categoryId === 'cat-5' && p.isActive), [products]);

  // Manejar modificadores (toggle click)
  const toggleModifier = (modId) => {
    setSelectedModifiers(prev => 
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    );
  };

  // Calcular precio total unitario
  const unitPrice = useMemo(() => {
    let total = product.price;
    if (isCombo) {
      total += Number(comboPrice) || 0;
    }
    selectedModifiers.forEach(modId => {
      const mod = (modifiers || []).find(m => m.id === modId);
      if (mod && mod.priceDelta) {
        total += Number(mod.priceDelta) || 0;
      }
    });
    return total;
  }, [product, isCombo, selectedModifiers, modifiers, comboPrice]);

  const handleConfirm = () => {
    if (isCombo && (!selectedSide || !selectedDrink)) {
      alert('Por favor selecciona un acompañamiento y una bebida para el combo.');
      return;
    }

    const comboDetails = isCombo ? {
      isCombo: true,
      sideId: selectedSide,
      drinkId: selectedDrink,
      priceDelta: Number(comboPrice) || 0
    } : null;

    onConfirm(product, selectedModifiers, comboDetails, specialNote, quantity);
  };

  const isBurgerOrMain = ['cat-1', 'cat-2'].includes(product.categoryId);

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: 640, width: '92%' }}>
        
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title flex items-center gap-2">
              Personalizar {product.name}
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
              Precio base unitario: <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatCOP(product.price)}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxHeight: '68vh', overflowY: 'auto' }}>
          
          {/* OPCIÓN COMBO */}
          {isBurgerOrMain && (
            <div style={{ 
              background: isCombo ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)', 
              border: `1.5px solid ${isCombo ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)', 
              padding: 'var(--space-4)',
              transition: 'all 0.2s ease'
            }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setIsCombo(!isCombo)}
              >
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: isCombo ? 'var(--accent)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🍟 Convertir en Combo
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Incluye 1 Acompañamiento y 1 Bebida por <strong>+{formatCOP(comboPrice)}</strong> adicionales.
                  </p>
                </div>
                
                {/* Switch visual */}
                <div style={{
                  width: 46, height: 26, borderRadius: 13,
                  backgroundColor: isCombo ? 'var(--accent)' : 'var(--border)',
                  position: 'relative', transition: 'background-color 0.2s ease',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    backgroundColor: isCombo ? '#000' : '#fff',
                    position: 'absolute', top: 3,
                    left: isCombo ? 23 : 3,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>

              {isCombo && (
                <div className="grid-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      1. Acompañamiento *
                    </label>
                    <select 
                      className="form-select" 
                      value={selectedSide} 
                      onChange={(e) => setSelectedSide(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar papas / acompañamiento...</option>
                      {sides.map(side => (
                        <option key={side.id} value={side.id}>{side.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                      2. Bebida *
                    </label>
                    <select 
                      className="form-select" 
                      value={selectedDrink} 
                      onChange={(e) => setSelectedDrink(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar gaseosa / bebida...</option>
                      {drinks.map(drink => (
                        <option key={drink.id} value={drink.id}>{drink.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ADICIONES Y MODIFICADORES */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }} className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" /> Adiciones y Preferencias de Preparación
              </h3>
              <span className="text-xs text-muted">
                {selectedModifiers.length} seleccionada(s)
              </span>
            </div>
            
            <p className="text-xs text-muted mb-3">
              Haz clic sobre cada opción para activarla o desactivarla en esta unidad.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-2)' }}>
              {(modifiers || []).map(mod => {
                const isSelected = selectedModifiers.includes(mod.id);
                return (
                  <button
                    type="button"
                    key={mod.id} 
                    onClick={() => toggleModifier(mod.id)}
                    className="card p-3 transition"
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSelected ? 'rgba(34,197,94,0.12)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${isSelected ? '#22c55e' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      outline: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, 
                        border: `2px solid ${isSelected ? '#22c55e' : 'var(--border-light)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isSelected ? '#22c55e' : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}>
                        {isSelected && <Check size={12} color="#000" strokeWidth={3} />}
                      </div>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}>
                        {mod.name}
                      </span>
                    </div>

                    {mod.priceDelta > 0 ? (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: isSelected ? '#22c55e' : '#f59e0b', 
                        fontWeight: 700, 
                        marginLeft: 4, 
                        flexShrink: 0 
                      }}>
                        +{formatCOP(mod.priceDelta)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 4, flexShrink: 0 }}>
                        $0
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {(!modifiers || modifiers.length === 0) && (
              <div className="text-center py-4 text-xs text-muted">
                No hay modificadores creados. Puedes crearlos en Gestión de Menú → Adiciones.
              </div>
            )}
          </div>

          {/* NOTAS ESPECIALES */}
          <div className="form-group">
            <label className="form-label">Notas para Cocina (Opcional)</label>
            <input 
              type="text"
              className="form-input" 
              placeholder="Ej: Carne bien asada, sin salsas, salsa aparte..."
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Selector de Cantidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cantidad:</span>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border)' }}>
              <button 
                type="button"
                className="btn btn-ghost btn-icon btn-sm" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <Minus size={14} />
              </button>
              <span style={{ width: 32, textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>{quantity}</span>
              <button 
                type="button"
                className="btn btn-ghost btn-icon btn-sm" 
                onClick={() => setQuantity(quantity + 1)}
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <Plus size={14} />
              </button>
            </div>
            {quantity > 1 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ({quantity} unidades iguales)
              </span>
            )}
          </div>

          {/* Total y Botón Agregar */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total ítem</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>
                {formatCOP(unitPrice * quantity)}
              </div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleConfirm}>
              <Plus size={16} /> Agregar al Pedido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
