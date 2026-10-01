import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Check, 
  Calendar as CalendarIcon, 
  StickyNote, 
  Save 
} from 'lucide-react';

export default function EditDayModal({ 
  dateStr, 
  record, 
  billData, 
  onSave, 
  onClose 
}) {
  const [lunchTaken, setLunchTaken] = useState(false);
  const [dinnerTaken, setDinnerTaken] = useState(false);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setLunchTaken(!!record.lunch_taken);
      setDinnerTaken(!!record.dinner_taken);
      setNote(record.note || '');
    } else {
      setLunchTaken(false);
      setDinnerTaken(false);
      setNote('');
    }
  }, [record, dateStr]);

  if (!dateStr) return null;

  const dateObj = new Date(dateStr + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const lunchPrice = billData?.lunch_price || 0;
  const dinnerPrice = billData?.dinner_price || 0;
  const currentCost = (lunchTaken ? lunchPrice : 0) + (dinnerTaken ? dinnerPrice : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(dateStr, lunchTaken, dinnerTaken, note);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon-badge">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="modal-title">Edit Attendance</h3>
              <p className="modal-date-text">{formattedDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Toggles */}
          <div className="modal-toggles-grid">
            {/* Lunch Toggle */}
            <div 
              className={`modal-toggle-box lunch-box ${lunchTaken ? 'active' : ''}`}
              onClick={() => setLunchTaken(!lunchTaken)}
              role="button"
              tabIndex={0}
            >
              <div className="toggle-box-header">
                <Sun size={20} className="icon-lunch" />
                <span className="price-tag">₹{lunchPrice}</span>
              </div>
              <div className="toggle-box-body">
                <span className="toggle-label">Lunch</span>
                <span className="toggle-status">{lunchTaken ? '✓ Taken' : '✕ Skipped'}</span>
              </div>
            </div>

            {/* Dinner Toggle */}
            <div 
              className={`modal-toggle-box dinner-box ${dinnerTaken ? 'active' : ''}`}
              onClick={() => setDinnerTaken(!dinnerTaken)}
              role="button"
              tabIndex={0}
            >
              <div className="toggle-box-header">
                <Moon size={20} className="icon-dinner" />
                <span className="price-tag">₹{dinnerPrice}</span>
              </div>
              <div className="toggle-box-body">
                <span className="toggle-label">Dinner</span>
                <span className="toggle-status">{dinnerTaken ? '✓ Taken' : '✕ Skipped'}</span>
              </div>
            </div>
          </div>

          <div className="modal-day-total">
            <span>Day Total:</span>
            <strong>₹{currentCost}</strong>
          </div>

          {/* Note Input */}
          <div className="form-group">
            <label className="input-label">
              <StickyNote size={14} />
              <span>Note (Optional)</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g., Skipped lunch, Exam day, Went home..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-input"
            />
          </div>

          {/* Buttons */}
          <div className="modal-buttons-row">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
