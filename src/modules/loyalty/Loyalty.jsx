import { useState } from 'react';
import { 
  Users, Gift, Settings2, Plus, Search, Edit2, Trash2, Eye, Award, 
  TrendingUp, TrendingDown, Clock, ShieldCheck, Heart
} from 'lucide-react';
import { useLoyaltyStore } from '../../store/loyaltyStore';
import { formatCOP } from '../../utils/currency';

export default function Loyalty() {
  const { 
    customers, rewards, settings, 
    addCustomer, updateCustomer, deleteCustomer, 
    addReward, updateReward, deleteReward, 
    updateSettings 
  } = useLoyaltyStore();

  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'rewards' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');

  // Modales y estados auxiliares
  const [customerModal, setCustomerModal] = useState({ isOpen: false, mode: 'create', data: null });
  const [customerDetailModal, setCustomerDetailModal] = useState({ isOpen: false, data: null });
  const [rewardModal, setRewardModal] = useState({ isOpen: false, mode: 'create', data: null });

  // Formularios
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', points: 0 });
  const [rewardForm, setRewardForm] = useState({ name: '', pointsCost: 0, stock: 0 });
  const [settingsForm, setSettingsForm] = useState({
    accumulationRate: settings.accumulationRate,
    redemptionRate: settings.redemptionRate,
    isActive: settings.isActive
  });

  // --- CLIENTES ACTIONS ---
  const handleOpenCustomerModal = (mode, data = null) => {
    if (mode === 'edit' && data) {
      setCustomerForm({ name: data.name, phone: data.phone, email: data.email, points: data.points });
    } else {
      setCustomerForm({ name: '', phone: '', email: '', points: 0 });
    }
    setCustomerModal({ isOpen: true, mode, data });
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.phone) {
      alert('Nombre y Teléfono son campos obligatorios.');
      return;
    }
    try {
      if (customerModal.mode === 'create') {
        addCustomer({
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          points: Number(customerForm.points) || 0
        });
      } else {
        updateCustomer(customerModal.data.id, {
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          points: Number(customerForm.points) || 0
        });
      }
      setCustomerModal({ isOpen: false, mode: 'create', data: null });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente? Se borrará su historial.')) {
      deleteCustomer(id);
    }
  };

  // --- PREMIOS ACTIONS ---
  const handleOpenRewardModal = (mode, data = null) => {
    if (mode === 'edit' && data) {
      setRewardForm({ name: data.name, pointsCost: data.pointsCost, stock: data.stock });
    } else {
      setRewardForm({ name: '', pointsCost: 50, stock: 10 });
    }
    setRewardModal({ isOpen: true, mode, data });
  };

  const handleSaveReward = (e) => {
    e.preventDefault();
    if (!rewardForm.name || rewardForm.pointsCost <= 0) {
      alert('Nombre y costo de puntos válido obligatorio.');
      return;
    }
    if (rewardModal.mode === 'create') {
      addReward({
        name: rewardForm.name,
        pointsCost: Number(rewardForm.pointsCost),
        stock: Number(rewardForm.stock) || 0
      });
    } else {
      updateReward(rewardModal.data.id, {
        name: rewardForm.name,
        pointsCost: Number(rewardForm.pointsCost),
        stock: Number(rewardForm.stock) || 0
      });
    }
    setRewardModal({ isOpen: false, mode: 'create', data: null });
  };

  const handleDeleteReward = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este premio del catálogo?')) {
      deleteReward(id);
    }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      accumulationRate: Number(settingsForm.accumulationRate),
      redemptionRate: Number(settingsForm.redemptionRate),
      isActive: settingsForm.isActive
    });
    alert('Configuración guardada correctamente.');
  };

  // Filtrado de clientes
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Heart className="text-danger" size={28} style={{ fill: 'var(--red-500)' }} />
            Club de Fidelización
          </h1>
          <p className="page-subtitle">Gestiona clientes frecuentes, puntos y catálogo de recompensas</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'customers' && (
            <button className="btn btn-primary" onClick={() => handleOpenCustomerModal('create')}>
              <Plus size={16} /> Registrar Cliente
            </button>
          )}
          {activeTab === 'rewards' && (
            <button className="btn btn-primary" onClick={() => handleOpenRewardModal('create')}>
              <Plus size={16} /> Nuevo Premio
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Users size={16} /> Clientes
        </button>
        <button 
          onClick={() => setActiveTab('rewards')}
          className={`btn ${activeTab === 'rewards' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Gift size={16} /> Catálogo de Premios
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Settings2 size={16} /> Configuración
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'customers' && (
          <div className="flex flex-col gap-4">
            {/* KPI Summary Cards */}
            <div className="kpi-grid">
              <div className="kpi-card amber">
                <div className="kpi-icon amber">
                  <Users size={22} />
                </div>
                <div className="kpi-label">Clientes Activos</div>
                <div className="kpi-value">{customers.length}</div>
                <div className="kpi-sub">En el programa de fidelización</div>
              </div>

              <div className="kpi-card green">
                <div className="kpi-icon green">
                  <Award size={22} />
                </div>
                <div className="kpi-label">Total Puntos Activos</div>
                <div className="kpi-value">
                  {customers.reduce((acc, curr) => acc + curr.points, 0).toLocaleString()} <span className="text-sm text-muted">pts</span>
                </div>
                <div className="kpi-sub">Acumulados en el sistema</div>
              </div>

              <div className="kpi-card blue">
                <div className="kpi-icon blue">
                  <ShieldCheck size={22} />
                </div>
                <div className="kpi-label">Valor de Redención</div>
                <div className="kpi-value">{formatCOP(settings.redemptionRate)}<span className="text-sm text-muted">/pt</span></div>
                <div className="kpi-sub">1 punto = {formatCOP(settings.redemptionRate)} desc.</div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar cliente por teléfono, nombre o correo..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '40px' }}
              />
              <Search size={18} className="text-muted" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Customers Table */}
            <div className="card p-0 overflow-hidden">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th className="text-right">Puntos Disponibles</th>
                      <th className="text-right">Equivalencia</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted" style={{ padding: '40px' }}>
                          No se encontraron clientes registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map(cust => {
                        const initials = cust.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        return (
                          <tr key={cust.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
                                  color: '#000',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {initials}
                                </div>
                                <span className="font-bold text-primary">{cust.name}</span>
                              </div>
                            </td>
                            <td className="text-muted font-mono">{cust.phone}</td>
                            <td className="text-muted">{cust.email || '—'}</td>
                            <td className="text-right font-bold text-success">
                              <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                                <Award size={12} /> {cust.points.toLocaleString()} pts
                              </span>
                            </td>
                            <td className="text-right font-semibold text-muted">
                              {formatCOP(cust.points * settings.redemptionRate)}
                            </td>
                            <td className="text-center">
                              <div className="flex gap-1 justify-center">
                                <button 
                                  className="btn btn-ghost btn-sm btn-icon" 
                                  title="Ver Historial"
                                  onClick={() => setCustomerDetailModal({ isOpen: true, data: cust })}
                                >
                                  <Eye size={15} />
                                </button>
                                <button 
                                  className="btn btn-ghost btn-sm btn-icon" 
                                  title="Editar"
                                  onClick={() => handleOpenCustomerModal('edit', cust)}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm btn-icon" 
                                  title="Eliminar"
                                  onClick={() => handleDeleteCustomer(cust.id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="grid-4">
            {rewards.map(reward => (
              <div key={reward.id} className="card flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="kpi-icon amber" style={{ marginBottom: 0 }}>
                      <Gift size={22} />
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                      <Award size={12} /> {reward.pointsCost} pts
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{reward.name}</h3>
                  <p className="text-sm text-muted">Disponibles: <strong className="text-primary">{reward.stock} uds</strong></p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className={`badge ${reward.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {reward.stock > 0 ? 'En Stock' : 'Agotado'}
                  </span>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleOpenRewardModal('edit', reward)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteReward(reward.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
              <div className="card col-span-4 empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state-icon">🎁</div>
                <div className="empty-state-text">No hay premios creados en el catálogo de fidelización.</div>
                <button className="btn btn-primary mt-2" onClick={() => handleOpenRewardModal('create')}>
                  <Plus size={16} /> Crear Primer Premio
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card" style={{ maxWidth: 650 }}>
            <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="kpi-icon amber" style={{ marginBottom: 0 }}>
                <Settings2 size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg">Reglas del Sistema de Fidelización</h2>
                <p className="text-sm text-muted">Configura cómo acumulan y redimen puntos tus clientes</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
              <div className="form-group">
                <label className="form-label">Estado del Programa</label>
                <label className="flex items-center gap-3 p-3 card cursor-pointer" style={{ background: 'var(--bg-elevated)', marginBottom: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={settingsForm.isActive}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--amber-500)' }}
                  />
                  <div>
                    <span className="font-bold block">Habilitar acumulación y redención de puntos</span>
                    <span className="text-sm text-muted">Permite asignar clientes y usar puntos como medio de pago en el POS</span>
                  </div>
                </label>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Acumulación: Compras por 1 punto</label>
                  <input 
                    type="number" 
                    value={settingsForm.accumulationRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, accumulationRate: Number(e.target.value) })}
                    className="form-input"
                    min="1"
                    required
                  />
                  <span className="text-xs text-muted">Monto monetario de compra ($) para ganar 1 punto.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Redención: Valor de 1 punto</label>
                  <input 
                    type="number" 
                    value={settingsForm.redemptionRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, redemptionRate: Number(e.target.value) })}
                    className="form-input"
                    min="0.1"
                    step="any"
                    required
                  />
                  <span className="text-xs text-muted">Descuento equivalente ($) por cada punto redimido.</span>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button type="submit" className="btn btn-primary">
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- MODAL REGISTRO/EDICION CLIENTE --- */}
      {customerModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {customerModal.mode === 'create' ? '👤 Registrar Nuevo Cliente' : '✏️ Editar Cliente'}
              </h2>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCustomerModal({ isOpen: false, mode: 'create', data: null })}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input 
                    type="text" 
                    value={customerForm.name} 
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono / Celular *</label>
                  <input 
                    type="text" 
                    value={customerForm.phone} 
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={customerForm.email} 
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Puntos Iniciales</label>
                  <input 
                    type="number" 
                    value={customerForm.points} 
                    onChange={(e) => setCustomerForm({ ...customerForm, points: Number(e.target.value) })}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setCustomerModal({ isOpen: false, mode: 'create', data: null })}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {customerModal.mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE DE CLIENTE & HISTORIAL --- */}
      {customerDetailModal.isOpen && customerDetailModal.data && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{customerDetailModal.data.name}</h2>
                <span className="text-sm text-muted">Tel: {customerDetailModal.data.phone}</span>
              </div>
              <div className="text-right">
                <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>
                  <Award size={14} /> {customerDetailModal.data.points.toLocaleString()} pts
                </span>
              </div>
            </div>

            <div className="modal-body flex flex-col gap-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                <Clock size={14} /> Historial de Movimientos
              </h3>
              
              <div style={{ maxHeight: 260, overflowY: 'auto' }} className="flex flex-col gap-2">
                {customerDetailModal.data.history && customerDetailModal.data.history.length > 0 ? (
                  customerDetailModal.data.history.map(item => (
                    <div key={item.id} className="card p-3 flex justify-between items-center" style={{ background: 'var(--bg-elevated)' }}>
                      <div>
                        <div className="font-bold text-sm">{item.description}</div>
                        <div className="text-xs text-muted">{new Date(item.date).toLocaleString()}</div>
                      </div>
                      <div className={`font-bold flex items-center gap-1 ${
                        item.type === 'accumulation' ? 'text-success' : 'text-danger'
                      }`}>
                        {item.type === 'accumulation' ? (
                          <>
                            <TrendingUp size={14} />
                            +{item.points} pts
                          </>
                        ) : (
                          <>
                            <TrendingDown size={14} />
                            -{item.points} pts
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state p-6">
                    <div className="empty-state-text">Este cliente no tiene movimientos de puntos.</div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setCustomerDetailModal({ isOpen: false, data: null })}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL REGISTRO/EDICION PREMIO --- */}
      {rewardModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {rewardModal.mode === 'create' ? '🎁 Agregar Premio' : '✏️ Editar Premio'}
              </h2>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setRewardModal({ isOpen: false, mode: 'create', data: null })}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveReward}>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre del Premio *</label>
                  <input 
                    type="text" 
                    value={rewardForm.name} 
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Costo en Puntos *</label>
                    <input 
                      type="number" 
                      value={rewardForm.pointsCost} 
                      onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: Number(e.target.value) })}
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock de Premios</label>
                    <input 
                      type="number" 
                      value={rewardForm.stock} 
                      onChange={(e) => setRewardForm({ ...rewardForm, stock: Number(e.target.value) })}
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setRewardModal({ isOpen: false, mode: 'create', data: null })}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {rewardModal.mode === 'create' ? 'Guardar Premio' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
