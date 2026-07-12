import { useState } from 'react';
import { X, Users, List } from 'lucide-react';
import { usePosStore } from '../../store/posStore';
import { formatCOP } from '../../utils/currency';

export default function SplitModal({ totals, items, onClose }) {
  const setSplitCount = usePosStore((s) => s.setSplitCount);
  const currentSplit = usePosStore((s) => s.currentOrder.splitCount);
  
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'item'
  const [people, setPeople] = useState(currentSplit > 1 ? currentSplit.toString() : '2');

  const applyEqualSplit = () => {
    const count = parseInt(people, 10);
    if (count > 1) {
      setSplitCount(count);
      onClose();
    }
  };

  const clearSplit = () => {
    setSplitCount(1);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-md">
        <div className="modal-header">
          <h3 className="modal-title">Dividir Cuenta</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="flex gap-2 mb-4">
            <button 
              className={`btn ${splitType === 'equal' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => setSplitType('equal')}
            >
              <Users size={18} /> Partes Iguales
            </button>
            <button 
              className={`btn ${splitType === 'item' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => setSplitType('item')}
              disabled
              title="Próximamente"
            >
              <List size={18} /> Por Ítem (Próximamente)
            </button>
          </div>

          {splitType === 'equal' && (
            <div>
              <div className="flex gap-4 items-center mb-6">
                <label className="font-semibold">Número de personas:</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  className="form-input"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  style={{ width: '100px' }}
                />
              </div>

              <div className="card text-center py-6 mb-4">
                <div className="text-sm text-secondary mb-2">Total a pagar por persona</div>
                <div className="text-2xl font-bold text-accent">
                  {formatCOP(totals.grandTotal / (parseInt(people, 10) || 1))}
                </div>
              </div>

              <div className="flex gap-2">
                 {currentSplit > 1 && (
                  <button className="btn btn-ghost" onClick={clearSplit}>
                    Quitar División
                  </button>
                )}
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }} 
                  onClick={applyEqualSplit}
                  disabled={!people || parseInt(people, 10) < 2}
                >
                  Aplicar División
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
