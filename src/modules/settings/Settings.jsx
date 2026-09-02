import { useState, useRef } from 'react';
import { 
  Building2, FileText, Shield, Image, Save, Eye, 
  Printer, Check, Upload, X, ChevronRight, AlertCircle,
  Receipt, Hash, Calendar, Phone, Mail, Globe, MapPin,
  Plus, Trash2, Edit2, UserCog, User, Key
} from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import { ROLES } from '../../utils/permissions';


export default function Settings() {
  const { config, updateConfig } = usePosStore();
  const { users, addUser, updateUser, deleteUser, activeUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState('empresa'); // 'empresa' | 'factura' | 'legal' | 'usuarios'
  const [savedNotice, setSavedNotice] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Form de config general (empresa + legal + factura todo en uno)
  const [form, setForm] = useState({
    name:                    config?.name || '',
    slogan:                  config?.slogan || '',
    nit:                     config?.nit || '',
    address:                 config?.address || '',
    phone:                   config?.phone || '',
    email:                   config?.email || '',
    website:                 config?.website || '',
    city:                    config?.city || 'Bogotá',
    department:              config?.department || 'Cundinamarca',
    country:                 config?.country || 'Colombia',
    taxRegime:               config?.taxRegime || 'Régimen Simplificado',
    taxName:                 config?.taxName || 'Impoconsumo',
    taxRate:                 config?.taxRate != null ? (config.taxRate * 100) : 8,
    invoiceResolution:       config?.invoiceResolution || '',
    invoiceResolutionDate:   config?.invoiceResolutionDate || '',
    invoicePrefix:           config?.invoicePrefix || 'FAC',
    invoiceFrom:             config?.invoiceFrom || '',
    invoiceTo:               config?.invoiceTo || '',
    legalFooter:             config?.legalFooter || 'Esta factura se asimila en todos sus efectos a una letra de cambio. Art. 774 Código de Comercio.',
    returnPolicy:            config?.returnPolicy || 'No se aceptan devoluciones ni cambios después de 24 horas.',
    thankYouMessage:         config?.thankYouMessage || '¡Gracias por preferirnos! Vuelva pronto.',
    logoUrl:                 config?.logoUrl || '',
    comboPrice:              config?.comboPrice ?? 12000,
  });

  const logoInputRef = useRef(null);

  // --- Gestión de Usuarios ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'mesero' });

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({ name: user.name, username: user.username, password: user.password, role: user.role });
    } else {
      setEditingUserId(null);
      setUserForm({ name: '', username: '', password: '', role: 'mesero' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.username || !userForm.password) return;
    if (editingUserId) {
      updateUser(editingUserId, userForm);
    } else {
      if (users.some(u => u.username === userForm.username)) {
        alert('Este nombre de usuario ya está en uso.');
        return;
      }
      addUser(userForm);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id) => {
    if (id === activeUser.id) {
      alert('No puedes eliminar tu propio usuario mientras estás conectado.');
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar este usuario del sistema?')) {
      deleteUser(id);
    }
  };

  // --- Guardar Config Negocio ---
  const handleSaveConfig = () => {
    updateConfig({
      ...form,
      taxRate: Number(form.taxRate) / 100,
      comboPrice: Number(form.comboPrice),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  // --- Manejo de Logo ---
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube una imagen válida (JPG, PNG, SVG, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, logoUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const TABS = [
    { id: 'empresa',  icon: Building2,  label: 'Empresa' },
    { id: 'factura',  icon: Receipt,    label: 'Factura y DIAN' },
    { id: 'legal',    icon: Shield,     label: 'Textos Legales' },
    { id: 'usuarios', icon: UserCog,    label: 'Usuarios' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="text-accent" size={24} /> Configuración del Sistema
          </h1>
          <p className="page-subtitle">
            Datos de tu empresa, configuración de factura, textos legales y gestión de usuarios
          </p>
        </div>

        {activeTab !== 'usuarios' && (
          <div className="flex gap-2">
            {savedNotice && (
              <div className="badge badge-success p-2 flex items-center gap-2 font-bold text-xs">
                <Check size={14} /> ¡Guardado!
              </div>
            )}
            <button 
              className="btn btn-ghost" 
              onClick={() => setPreviewMode(!previewMode)}
              title="Vista previa de la factura"
            >
              <Eye size={16} /> Vista Previa
            </button>
            <button className="btn btn-primary flex items-center gap-2" onClick={handleSaveConfig}>
              <Save size={16} /> Guardar Cambios
            </button>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <button className="btn btn-primary" onClick={() => openUserModal()}>
            <Plus size={16} /> Nuevo Usuario
          </button>
        )}
      </div>

      <div className="flex gap-6" style={{ alignItems: 'flex-start' }}>
        {/* Sidebar Tabs */}
        <div className="card p-3 flex flex-col gap-1" style={{ minWidth: 200, flexShrink: 0 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`btn btn-sm text-left justify-start gap-2 ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setActiveTab(tab.id); setPreviewMode(false); }}
                style={{ display: 'flex', justifyContent: 'flex-start' }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>

          {/* ─── TAB: EMPRESA ─── */}
          {activeTab === 'empresa' && (
            <div className="card p-6 flex flex-col gap-5">
              <div className="border-b border-light pb-4">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Building2 size={20} className="text-accent" /> Datos de la Empresa
                </h2>
                <p className="text-xs text-muted mt-1">
                  Esta información aparecerá en el encabezado de tus facturas y comprobantes.
                </p>
              </div>

              {/* Logo Upload */}
              <div className="form-group">
                <label className="form-label font-bold">Logo del Negocio</label>
                <div className="flex items-center gap-4">
                  <div style={{
                    width: 90, height: 90, borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0
                  }}>
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Image size={32} className="text-muted" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleLogoUpload} 
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm flex items-center gap-2"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload size={14} /> Subir Logo (PNG, JPG, SVG)
                    </button>
                    {form.logoUrl && (
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm text-muted"
                        onClick={() => updateForm('logoUrl', '')}
                      >
                        <X size={12} /> Quitar Logo
                      </button>
                    )}
                    <p className="text-xs text-muted">Recomendado: formato cuadrado, mín. 150x150px</p>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nombre del Negocio *</label>
                  <input className="form-input" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Ej: Paladar Grill al Carbón" />
                </div>
                <div className="form-group">
                  <label className="form-label">Eslogan / Descripción</label>
                  <input className="form-input" value={form.slogan} onChange={e => updateForm('slogan', e.target.value)} placeholder="Ej: La mejor parrilla de la ciudad" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">NIT / Cédula del Negocio</label>
                  <input className="form-input" value={form.nit} onChange={e => updateForm('nit', e.target.value)} placeholder="Ej: 900.123.456-7" />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono(s)</label>
                  <input className="form-input" value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="Ej: 601-234-5678 / 310-987-6543" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección Completa</label>
                <input className="form-input" value={form.address} onChange={e => updateForm('address', e.target.value)} placeholder="Ej: Calle 100 # 15-20, Local 3" />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input className="form-input" value={form.city} onChange={e => updateForm('city', e.target.value)} placeholder="Bogotá" />
                </div>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <input className="form-input" value={form.department} onChange={e => updateForm('department', e.target.value)} placeholder="Cundinamarca" />
                </div>
                <div className="form-group">
                  <label className="form-label">País</label>
                  <input className="form-input" value={form.country} onChange={e => updateForm('country', e.target.value)} placeholder="Colombia" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="info@mirestaurante.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sitio Web (Opcional)</label>
                  <input type="url" className="form-input" value={form.website} onChange={e => updateForm('website', e.target.value)} placeholder="www.paladar.com.co" />
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: FACTURA Y DIAN ─── */}
          {activeTab === 'factura' && (
            <div className="card p-6 flex flex-col gap-5">
              <div className="border-b border-light pb-4">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Receipt size={20} className="text-accent" /> Configuración de Factura y DIAN
                </h2>
                <p className="text-xs text-muted mt-1">
                  Información tributaria y resolución de facturación exigida por la DIAN para Colombia.
                </p>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label font-bold">Régimen Tributario</label>
                  <select className="form-select" value={form.taxRegime} onChange={e => updateForm('taxRegime', e.target.value)}>
                    <option value="Régimen Simplificado">Régimen Simplificado (No responsable de IVA)</option>
                    <option value="Responsable de IVA">Responsable de IVA (Gran contribuyente)</option>
                    <option value="Régimen Simple de Tributación">Régimen Simple de Tributación (SIMPLE)</option>
                    <option value="Persona Natural">Persona Natural</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold">Impuesto al Consumo / IVA (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={form.taxRate} 
                    onChange={e => updateForm('taxRate', e.target.value)} 
                    min="0" max="100" step="0.5"
                    placeholder="8"
                  />
                  <p className="text-xs text-muted mt-1">Impoconsumo Restaurantes = 8% · IVA General = 19%</p>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                  <Hash size={15} className="text-accent" /> Resolución de Facturación DIAN
                </h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Número de Resolución</label>
                    <input className="form-input" value={form.invoiceResolution} onChange={e => updateForm('invoiceResolution', e.target.value)} placeholder="Ej: 18764000001234" />
                    <p className="text-xs text-muted mt-1">Número asignado por la DIAN</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Resolución</label>
                    <input type="date" className="form-input" value={form.invoiceResolutionDate} onChange={e => updateForm('invoiceResolutionDate', e.target.value)} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Prefijo de Factura</label>
                    <input className="form-input" value={form.invoicePrefix} onChange={e => updateForm('invoicePrefix', e.target.value)} placeholder="FAC" maxLength={5} style={{ textTransform: 'uppercase' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Numeración Desde</label>
                    <input type="number" className="form-input" value={form.invoiceFrom} onChange={e => updateForm('invoiceFrom', e.target.value)} placeholder="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Numeración Hasta</label>
                    <input type="number" className="form-input" value={form.invoiceTo} onChange={e => updateForm('invoiceTo', e.target.value)} placeholder="100000" />
                  </div>
                </div>
              </div>

              {/* Preview de cómo se verá el encabezado */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--border)' }}>
                <h4 className="font-bold text-sm mb-3 text-muted uppercase">Vista Previa del Encabezado de Factura</h4>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-light)', paddingBottom: 8, marginBottom: 8 }}>
                    {form.logoUrl && <div>[ 🖼 LOGO ]</div>}
                    <div style={{ fontWeight: '900', fontSize: '15px' }}>{form.name || 'MI RESTAURANTE'}</div>
                    {form.slogan && <div style={{ fontSize: '11px' }}>{form.slogan}</div>}
                    {form.nit && <div>NIT: {form.nit}</div>}
                    <div style={{ fontSize: '11px' }}>{form.taxRegime}</div>
                    {form.address && <div style={{ fontSize: '11px' }}>{form.address}</div>}
                    {form.city && <div style={{ fontSize: '11px' }}>{form.city} - {form.department}</div>}
                    {form.phone && <div style={{ fontSize: '11px' }}>Tel: {form.phone}</div>}
                    <div style={{ fontWeight: '800', marginTop: 6 }}>FACTURA DE VENTA</div>
                    {form.invoiceResolution && (
                      <div style={{ fontSize: '10px' }}>
                        Resolución DIAN No. {form.invoiceResolution}
                        {form.invoiceResolutionDate && ` del ${form.invoiceResolutionDate}`}
                      </div>
                    )}
                    {form.invoiceFrom && (
                      <div style={{ fontSize: '10px' }}>
                        Rango Autorizado: {form.invoicePrefix}{form.invoiceFrom} - {form.invoicePrefix}{form.invoiceTo}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: TEXTOS LEGALES ─── */}
          {activeTab === 'legal' && (
            <div className="card p-6 flex flex-col gap-5">
              <div className="border-b border-light pb-4">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Shield size={20} className="text-accent" /> Textos Legales de la Factura
                </h2>
                <p className="text-xs text-muted mt-1">
                  Estos textos aparecerán al pie de cada factura de venta impresa o enviada al cliente.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Mensaje de Agradecimiento</label>
                <input 
                  className="form-input" 
                  value={form.thankYouMessage} 
                  onChange={e => updateForm('thankYouMessage', e.target.value)} 
                  placeholder="¡Gracias por su visita! Lo esperamos pronto." 
                />
                <p className="text-xs text-muted mt-1">Aparece en la parte de abajo del ticket, visible para el cliente.</p>
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Política de Devoluciones</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={form.returnPolicy} 
                  onChange={e => updateForm('returnPolicy', e.target.value)} 
                  placeholder="Ej: No se aceptan devoluciones después de recibir el pedido." 
                />
              </div>

              <div className="form-group">
                <label className="form-label font-bold">Pie Legal (Obligatorio - Código de Comercio)</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={form.legalFooter} 
                  onChange={e => updateForm('legalFooter', e.target.value)} 
                  placeholder="Esta factura se asimila en todos sus efectos a una letra de cambio..." 
                />
                <p className="text-xs text-muted mt-1">
                  Texto legal requerido por el Art. 774 del Código de Comercio de Colombia.
                </p>
              </div>

              {/* Preview del footer de factura */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--border)' }}>
                <h4 className="font-bold text-xs text-muted uppercase mb-3">Vista Previa del Pie de Factura</h4>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: 1.5, textAlign: 'center', borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
                  <div style={{ fontWeight: 700 }}>{form.thankYouMessage}</div>
                  {form.returnPolicy && <div style={{ marginTop: 4, fontSize: '10px', color: 'var(--text-muted)' }}>{form.returnPolicy}</div>}
                  {form.legalFooter && <div style={{ marginTop: 6, fontSize: '9px', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-light)', paddingTop: 6 }}>{form.legalFooter}</div>}
                  <div style={{ marginTop: 6, fontSize: '9px', color: 'var(--text-muted)' }}>Sistema Paladar Grill POS</div>
                </div>
              </div>

              {/* Nota legal informativa */}
              <div className="p-4 rounded-xl flex gap-3" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-secondary">
                  <strong className="text-primary">Requisitos DIAN para Factura de Venta (Art. 617 E.T.):</strong>
                  <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
                    <li>Razón social o apellidos y nombre del contribuyente</li>
                    <li>NIT del vendedor y del adquirente (si es empresa)</li>
                    <li>Número y fecha de la factura</li>
                    <li>Descripción específica o genérica de los bienes o servicios</li>
                    <li>Valor total de la operación con desglose del impuesto (IVA/Impoconsumo)</li>
                    <li>Indicación de no responsable de IVA (si aplica régimen simplificado)</li>
                    <li>Resolución DIAN que autorizó la numeración</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: USUARIOS ─── */}
          {activeTab === 'usuarios' && (
            <div className="card">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <UserCog size={20} className="text-accent" />
                <h2 className="font-bold text-lg">Usuarios del Sistema</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre Completo</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.name}</td>
                        <td className="text-muted">@{u.username}</td>
                        <td>
                          <span className={`badge ${
                            u.role === 'admin' ? 'badge-warning' :
                            u.role === 'cajero' ? 'badge-success' : 'badge-secondary'
                          } text-xs uppercase font-bold`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              className="btn btn-ghost btn-sm btn-icon" 
                              onClick={() => openUserModal(u)} 
                              title="Editar usuario"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm btn-icon" 
                              onClick={() => handleDeleteUser(u.id)} 
                              title="Eliminar usuario"
                              disabled={u.id === activeUser?.id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL DE USUARIO ─── */}
      {isUserModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2">
                <User size={18} /> {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setIsUserModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input 
                  className="form-input" 
                  value={userForm.name} 
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Ej: Carlos Rodríguez"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Usuario (Login) *</label>
                <input 
                  className="form-input" 
                  value={userForm.username} 
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Ej: carlos.r"
                  disabled={!!editingUserId}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input 
                  type="password"
                  className="form-input" 
                  value={userForm.password} 
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Mínimo 4 caracteres"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rol y Permisos</label>
                <select 
                  className="form-select" 
                  value={userForm.role} 
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  {Object.entries(ROLES).map(([key]) => (
                    <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setIsUserModalOpen(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveUser}
                disabled={!userForm.name || !userForm.username || !userForm.password}
              >
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
