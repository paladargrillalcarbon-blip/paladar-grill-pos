import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { formatCOP } from '../../utils/currency';

export default function TipModal({ netTotal, onClose }) {
  const setTip = usePosStore((s) => s.setTip);
  const currentTip = usePosStore((s) => s.currentOrder.tip);
  
  const [customTip, setCustomTip] = useState(currentTip > 0 && ![5, 10, 15].includes(Math.round((currentTip/netTotal)*100)) ? currentTip.toString() : '');

  const applyPercentTip = (percent) => {
    const tipAmount = Math.round(netTotal * (percent / 100));
    setTip(tipAmount, 'percent');
    onClose();
  };

  const applyCustomTip = () => {
    const amount = Number(customTip) || 0;
    setTip(amount, 'custom');
    onClose();
  };

  const clearTip = () => {
    setTip(0, null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3 className="modal-title">Propina</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-secondary mb-4">
            Selecciona el porcentaje sugerido o ingresa un monto manual. La propina no incluye Impoconsumo.
          </p>

          <div className="grid-3 mb-4">
            <button className="btn btn-ghost" onClick={() => applyPercentTip(5)}>
              5%<br/><small>{formatCOP(netTotal * 0.05)}</small>
            </button>
            <button className="btn btn-ghost" onClick={() => applyPercentTip(10)}>
              10%<br/><small>{formatCOP(netTotal * 0.10)}</small>
            </button>
            <button className="btn btn-ghost" onClick={() => applyPercentTip(15)}>
              15%<br/><small>{formatCOP(netTotal * 0.15)}</small>
            </button>
          </div>

          <div className="divider">O monto personalizado</div>

          <div className="flex gap-2 items-center mb-4">
            <DollarSign size={20} className="text-muted" />
            <input
              type="number"
              className="form-input"
              placeholder="Ej. 2000"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={applyCustomTip} disabled={!customTip}>
              Aplicar
            </button>
          </div>

          {currentTip > 0 && (
            <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={clearTip}>
              Eliminar propina actual ({formatCOP(currentTip)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
