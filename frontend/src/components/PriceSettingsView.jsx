import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sun, 
  Moon, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  History, 
  Save, 
  Copy,
  Info 
} from 'lucide-react';
import { api } from '../api';

export default function PriceSettingsView({ 
  selectedMonth, 
  selectedYear, 
  onSavePrices, 
  billData 
}) {
  const [lunchPrice, setLunchPrice] = useState('50');
  const [dinnerPrice, setDinnerPrice] = useState('60');
  const [isConfigured, setIsConfigured] = useState(false);
  const [suggestedFromPrev, setSuggestedFromPrev] = useState(false);
  const [prevPeriod, setPrevPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    loadPriceData();
  }, [selectedMonth, selectedYear]);

  const loadPriceData = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.getPriceSettings(selectedMonth, selectedYear);
      setIsConfigured(res.is_configured);
      setSuggestedFromPrev(res.suggested_from_previous);
      setPrevPeriod(res.previous_period || '');
      setLunchPrice(res.data.lunch_price || '50');
      setDinnerPrice(res.data.dinner_price || '60');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await onSavePrices(selectedMonth, selectedYear, lunchPrice, dinnerPrice);
      setIsConfigured(true);
      setSuggestedFromPrev(false);
      setSuccessMsg(`Prices successfully saved for ${monthNames[selectedMonth - 1]} ${selectedYear}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Error saving prices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="price-settings-container animate-fade-in">
      <div className="price-header-card glass-panel">
        <div className="price-icon-box">
          <Sliders size={22} />
        </div>
        <div>
          <h2 className="price-title">
            Meal Price Settings ({monthNames[selectedMonth - 1]} {selectedYear})
          </h2>
          <p className="price-subtitle">
            Configure rates per meal for this specific billing month.
          </p>
        </div>
      </div>

      {suggestedFromPrev && !isConfigured && (
        <div className="notice-banner-suggestion glass-panel">
          <Copy size={18} />
          <div>
            <strong>Suggested from previous month ({prevPeriod}):</strong>
            <p>We've pre-filled the prices from your latest active period. Click "Save Prices" to confirm or adjust.</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="notice-banner-success glass-panel">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="price-form-card glass-panel">
        <div className="price-inputs-grid">
          {/* Lunch Price Box */}
          <div className="price-input-card">
            <div className="price-card-header">
              <div className="meal-icon-circle lunch-circle">
                <Sun size={20} />
              </div>
              <span className="price-type-label">Lunch Price</span>
            </div>

            <div className="input-with-symbol">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={lunchPrice}
                onChange={(e) => setLunchPrice(e.target.value)}
                placeholder="50"
                className="price-number-input"
              />
            </div>
            <p className="price-helper-text">Per individual lunch taken</p>
          </div>

          {/* Dinner Price Box */}
          <div className="price-input-card">
            <div className="price-card-header">
              <div className="meal-icon-circle dinner-circle">
                <Moon size={20} />
              </div>
              <span className="price-type-label">Dinner Price</span>
            </div>

            <div className="input-with-symbol">
              <span className="currency-prefix">₹</span>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={dinnerPrice}
                onChange={(e) => setDinnerPrice(e.target.value)}
                placeholder="60"
                className="price-number-input"
              />
            </div>
            <p className="price-helper-text">Per individual dinner taken</p>
          </div>
        </div>

        {/* Reassurance info box */}
        <div className="price-guarantee-box">
          <ShieldCheck size={20} className="shield-icon" />
          <div className="guarantee-text">
            <strong>Historical Integrity Guaranteed</strong>
            <p>
              Updating prices for <em>{monthNames[selectedMonth - 1]} {selectedYear}</em> only affects this month's calculations. All previous months retain their own historically locked prices.
            </p>
          </div>
        </div>

        <div className="form-submit-row">
          <button type="submit" disabled={saving || loading} className="btn-primary btn-lg">
            <Save size={18} />
            <span>{saving ? 'Saving Prices...' : `Save Prices for ${monthNames[selectedMonth - 1]}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
