import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, ChevronRight, Tag, Save, Coffee } from 'lucide-react';
import { usePosStore }        from '../../store/posStore';
import { useOrdersStore }     from '../../store/ordersStore';
import { useInventoryStore }  from '../../store/inventoryStore';
import { formatCOP }          from '../../utils/currency';
import { calcOrderTotals }    from '../../utils/taxes';
import { isPromotionActive }  from '../../utils/promotions';
import { format }             from 'date-fns';
import PaymentModal           from './PaymentModal.jsx';
import TipModal               from './TipModal.jsx';
import SplitModal             from './SplitModal.jsx';
import CashCloseModal         from './CashCloseModal.jsx';

const ORDER_TYPES = [
  { id: 'local',     label: 'Mesa',           icon: '🍽️' },
  { id: 'takeaway',  label: 'Para llevar',     icon: '📦' },
  { id: 'own',       label: 'Domicilio Propio',icon: '🛵' },
  { id: 'rappi',     label: 'Rappi',           icon: '🔴' },
  { id: 'ifood',     label: 'iFood',           icon: '🟢' },
  { id: 'pedidosya', label: 'PedidosYa',       icon: '🔵' },
];

export default function POS() {
  const { categories, products, currentOrder, promotions, applyPromoToOrder, cashSession } = usePosStore();
  const setOrderType  = usePosStore((s) => s.setOrderType);
  const setOrderMeta  = usePosStore((s) => s.setOrderMeta);
  const addItem       = usePosStore((s) => s.addItem);
  const updateQty     = usePosStore((s) => s.updateItemQuantity);
  const removeItem    = usePosStore((s) => s.removeItem);
  const clearOrder    = usePosStore((s) => s.clearOrder);
  const loadOrder     = usePosStore((s) => s.loadOrder);
  
  const orders        = useOrdersStore((s) => s.orders);
  const saveOrder     = useOrdersStore((s) => s.saveOrder);
  
  const consumeForOrder = useInventoryStore((s) => s.consumeForOrder);
  
  const activePromos = useMemo(() => {
    return promotions.filter(isPromotionActive);
  }, [promotions]);

  const activeUnpaidOrders = useMemo(() => {
    return orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled');
  }, [orders]);

  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'tables'
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  
  const [showPayment,    setShowPayment]    = useState(false);
  const [showTip,        setShowTip]        = useState(false);
  const [showSplit,      setShowSplit]       = useState(false);
  const [showCashClose,  setShowCashClose]  = useState(false);
  const [showPromo,      setShowPromo]      = useState(false);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.categoryId === activeCategory && p.isActive),
    [products, activeCategory]
  );

  const totals = useMemo(
    () => calcOrderTotals(currentOrder.items, currentOrder.tip),
    [currentOrder.items, currentOrder.tip]
  );

  const handleAddItem = (product) => {
    const promo = activePromos.find((p) => {
      if (p.productIds?.includes(product.id)) return true;
      if (p.categoryIds?.includes(product.categoryId)) return true;
      return false;
    });
    addItem(product, [], promo || null);
  };

  const handleSaveToKitchen = () => {
    const saved = saveOrder(currentOrder, totals, []);
    consumeForOrder(saved.id, currentOrder.items, products, activePromos);
    clearOrder();
  };

  const handleConfirmPayment = (payments) => {
    saveOrder(currentOrder, totals, payments);
    if (!currentOrder.id) {
       const newId = Date.now().toString(); 
       consumeForOrder(newId, currentOrder.items, products, activePromos);
    }
    clearOrder();
    setShowPayment(false);
  };

  const handleLoadOrder = (order) => {
    loadOrder(order);
    setViewMode('menu');
  };

  const canCheckout = currentOrder.items.length > 0;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 128px)', gap: 'var(--space-4)', overflow: 'hidden' }}>

      {/* ── LEFT: Menú o Mesas ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflow: 'hidden' }}>

        {/* Fila superior: Tabs + Botón de Caja */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
              className={`btn ${viewMode === 'menu' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('menu')}
            >
              🍔 Menú y Toma de Pedidos
            </button>
            <button 
              className={`btn ${viewMode === 'tables' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('tables')}
            >
              <Coffee size={18}/> Órdenes Activas ({activeUnpaidOrders.length})
            </button>
          </div>

          {/* Botón Abrir / Cerrar Caja — Siempre visible */}
          <button
            className={`btn ${cashSession ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setShowCashClose(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cashSession ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            {cashSession ? '🔓 Caja Abierta — Cerrar' : '🔒 Caja Cerrada — Abrir'}
          </button>
        </div>

        {viewMode === 'tables' ? (
           <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
             {activeUnpaidOrders.length === 0 ? (
               <div className="empty-state">
                 <div className="empty-state-icon">✅</div>
                 <div className="empty-state-text">No hay órdenes sin pagar</div>
               </div>
             ) : (
               <div className="grid-3">
                 {activeUnpaidOrders.map(order => (
                   <div 
                     key={order.id} 
                     className="card p-4 cursor-pointer hover:border-accent transition"
                     style={{ border: currentOrder.id === order.id ? '2px solid var(--accent)' : '' }}
                     onClick={() => handleLoadOrder(order)}
                   >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg">
                          {order.type === 'local' ? `Mesa ${order.tableNumber}` : order.type === 'own' ? 'Delivery Propio' : order.type}
                        </span>
                        <span className="badge badge-warning">Sin Pagar</span>
                      </div>
                      <div className="text-sm text-secondary mb-2">{format(new Date(order.createdAt), 'HH:mm')}</div>
                      <div className="text-sm text-muted mb-3">{order.items.reduce((s,i) => s + i.quantity, 0)} ítems</div>
                      <div className="font-bold text-accent">{formatCOP(order.totals?.grandTotal || 0)}</div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        ) : (
          <>
            {/* Tipo de pedido */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {ORDER_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOrderType(t.id)}
                  className="btn btn-sm"
                  style={{
                    background: currentOrder.type === t.id
                      ? 'linear-gradient(135deg, var(--amber-500), var(--amber-600))'
                      : 'var(--bg-elevated)',
                    color: currentOrder.type === t.id ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${currentOrder.type === t.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Datos del pedido según tipo */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {currentOrder.type === 'local' && (
                <select
                  className="form-select"
                  value={currentOrder.tableNumber || ''}
                  onChange={(e) => setOrderMeta({ tableNumber: e.target.value })}
                  style={{ maxWidth: 180 }}
                >
                  <option value="" disabled>Seleccionar mesa...</option>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>Mesa {num}</option>
                  ))}
                </select>
              )}
              {['own','rappi','ifood','pedidosya','takeaway'].includes(currentOrder.type) && (
                <input
                  className="form-input"
                  placeholder="Nombre del cliente"
                  value={currentOrder.customerName}
                  onChange={(e) => setOrderMeta({ customerName: e.target.value })}
                  style={{ maxWidth: 220 }}
                />
              )}
              {currentOrder.type === 'own' && (
                <input
                  className="form-input"
                  placeholder="Dirección de entrega"
                  value={currentOrder.deliveryAddress}
                  onChange={(e) => setOrderMeta({ deliveryAddress: e.target.value })}
                />
              )}
              {['rappi','ifood','pedidosya'].includes(currentOrder.type) && (
                <input
                  className="form-input"
                  placeholder="# de pedido en plataforma"
                  value={currentOrder.platformOrderId}
                  onChange={(e) => setOrderMeta({ platformOrderId: e.target.value })}
                  style={{ maxWidth: 220 }}
                />
              )}
            </div>

            {/* Categorías */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="btn btn-sm"
                  style={{
                    background: activeCategory === cat.id ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: activeCategory === cat.id ? '#000' : 'var(--text-secondary)',
                    border: `1px solid ${activeCategory === cat.id ? 'var(--accent)' : 'var(--border)'}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Grid de productos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 'var(--space-3)',
              overflowY: 'auto',
              flex: 1,
            }}>
              {filteredProducts.map((product) => {
                const promo = activePromos.find(
                  (p) => p.productIds?.includes(product.id) || p.categoryIds?.includes(product.categoryId)
                );
                const discountedPrice = promo
                  ? product.price * (1 - (promo.type === 'percentage' ? promo.value / 100 : 0))
                  : null;

                return (
                  <button
                    key={product.id}
                    onClick={() => handleAddItem(product)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      cursor: 'pointer',
                      text: 'left',
                      transition: 'all var(--transition)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {promo && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'var(--red-500)', color: 'white',
                        fontSize: '0.6rem', fontWeight: 700,
                        padding: '2px 6px', borderRadius: 'var(--radius-full)',
                      }}>
                        {promo.type === 'percentage' ? `-${promo.value}%` : 'PROMO'}
                      </div>
                    )}
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>🍔</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {product.name}
                    </div>
                    <div>
                      {promo && discountedPrice ? (
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatCOP(product.price)}
                          </span>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--amber-400)' }}>
                            {formatCOP(discountedPrice)}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--amber-400)' }}>
                          {formatCOP(product.price)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Carrito ───────────────────── */}
      <div style={{
        width: 340,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Cart Header */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShoppingCart size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700 }}>{currentOrder.id ? 'Editando Pedido' : 'Nuevo Pedido'}</span>
            {currentOrder.items.length > 0 && (
              <span className="badge badge-warning">{currentOrder.items.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setShowCashClose(true)} title="Cierre de caja">
              💰
            </button>
            {currentOrder.items.length > 0 && (
              <button className="btn btn-sm btn-danger btn-icon" onClick={clearOrder} title="Limpiar pedido">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3)' }}>
          {currentOrder.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">Selecciona productos del menú</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {currentOrder.items.map((item, idx) => (
                <div key={item.id + idx} style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.name}</div>
                      {item.promotionId && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--red-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Tag size={10} /> Promo aplicada − {formatCOP(item.discountAmount)}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => removeItem(item.id)}>
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-sm btn-ghost btn-icon"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        style={{ width: 28, height: 28, padding: 0 }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        className="btn btn-sm btn-ghost btn-icon"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        style={{ width: 28, height: 28, padding: 0 }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.discountAmount > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCOP(item.price * item.quantity)}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCOP((item.price - item.discountAmount) * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales */}
        {currentOrder.items.length > 0 && (
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal bruto</span>
                <span>{formatCOP(totals.grossTotal)}</span>
              </div>
              {totals.totalDiscounts > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--red-400)' }}>
                  <span>Descuentos / Promos</span>
                  <span>− {formatCOP(totals.totalDiscounts)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <span>Venta neta</span>
                <span>{formatCOP(totals.netTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Impoconsumo 8%</span>
                <span>{formatCOP(totals.impoconsumo)}</span>
              </div>
              {currentOrder.tip > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--green-400)' }}>
                  <span>Propina</span>
                  <span>+ {formatCOP(currentOrder.tip)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                <span>TOTAL</span>
                <span style={{ color: 'var(--accent)' }}>{formatCOP(totals.grandTotal)}</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowPromo(true)}>
                <Tag size={16} className="text-accent" /> Promos
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowTip(true)}>
                💰 Propina
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowSplit(true)}>
                ✂️ Dividir
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}
                onClick={handleSaveToKitchen}
                disabled={!canCheckout}
                title="Guardar en mesa y mandar a cocina sin cobrar"
              >
                <Save size={16} /> Guardar
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}
                onClick={() => setShowPayment(true)}
                disabled={!canCheckout}
              >
                Cobrar <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showPayment && (
        <PaymentModal
          totals={totals}
          onClose={() => setShowPayment(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
      {showTip && (
        <TipModal
          netTotal={totals.netTotal}
          onClose={() => setShowTip(false)}
        />
      )}
      {showSplit && (
        <SplitModal
          totals={totals}
          items={currentOrder.items}
          onClose={() => setShowSplit(false)}
        />
      )}
      {showCashClose && (
        <CashCloseModal onClose={() => setShowCashClose(false)} />
      )}
      {showPromo && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Aplicar Descuento a la Orden</h2>
            </div>
            <div className="modal-body flex flex-col gap-2">
              <div 
                className="card p-3 cursor-pointer border-light hover:border-accent"
                onClick={() => { applyPromoToOrder(null); setShowPromo(false); }}
              >
                <span className="font-bold">❌ Quitar Promociones</span>
              </div>
              {promotions.filter(p => p.isActive).map(promo => (
                <div 
                  key={promo.id} 
                  className="card p-3 cursor-pointer border-light hover:border-accent flex justify-between items-center"
                  onClick={() => { applyPromoToOrder(promo); setShowPromo(false); }}
                >
                  <div>
                    <div className="font-bold text-lg">{promo.name}</div>
                    <div className="text-sm text-muted">{promo.description}</div>
                  </div>
                  <div className="font-bold text-accent">
                    {promo.type === 'percentage' ? `${promo.value}% DCTO` : `-$${promo.value}`}
                  </div>
                </div>
              ))}
              {promotions.filter(p => p.isActive).length === 0 && (
                <div className="text-center text-muted p-4">No hay promociones activas.</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost w-full" onClick={() => setShowPromo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
