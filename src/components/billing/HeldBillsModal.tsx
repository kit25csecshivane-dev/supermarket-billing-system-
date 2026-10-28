/**
 * Held Bills Modal
 * Allows cashiers to view parked draft bills, resume one into the active POS, or discard.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/database';
import { Play, Trash2, X, Clock } from 'lucide-react';

interface HeldBillsModalProps {
  onClose: () => void;
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({ onClose }) => {
  const { resumeBillById, triggerDbRefresh, showNotification } = useApp();
  const heldBills = db.getHeldBills();

  const handleResume = (id: string) => {
    const ok = resumeBillById(id);
    if (ok) {
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    db.removeHeldBill(id);
    triggerDbRefresh();
    showNotification('Held draft discarded', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Parked / Held Bills</h2>
            <p className="text-xs text-slate-500">
              Select a parked bill to resume scanning or payment
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {heldBills.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No held bills found</p>
              <p className="text-xs text-slate-500 mt-1">
                You can park an active bill by pressing [Hold Bill] on the POS screen.
              </p>
            </div>
          ) : (
            heldBills.map((bill) => {
              const itemsCount = bill.items.reduce(
                (sum: number, i: any) => sum + (i.quantity || 1),
                0
              );
              const estTotal = bill.items.reduce(
                (sum: number, i: any) => sum + (i.quantity || 1) * (i.unitPrice || 0),
                0
              );

              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-900/40 transition-colors shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 text-sm">{bill.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{itemsCount} items</span>
                      <span>·</span>
                      <span className="font-mono-numbers font-medium text-slate-800">
                        Approx ₹{estTotal.toFixed(2)}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(bill.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {bill.note && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">
                        Note: {bill.note}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResume(bill.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-semibold"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Resume</span>
                    </button>
                    <button
                      onClick={() => handleDelete(bill.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"
                      title="Discard held bill"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
