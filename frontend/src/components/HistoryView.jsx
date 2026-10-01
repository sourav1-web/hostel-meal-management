import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sun, 
  Moon, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../api';

export default function HistoryView({ onSelectMonth }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistoryList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-container animate-fade-in">
      <div className="history-header-card glass-panel">
        <div className="history-icon-box">
          <History size={22} />
        </div>
        <div className="history-header-text">
          <h2 className="history-title">Billing & Attendance History</h2>
          <p className="history-subtitle">
            Browse through all past months, meal tallies, and settlement records.
          </p>
        </div>
        <button onClick={loadHistory} className="btn-icon-refresh" title="Refresh History">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="history-loading glass-panel">Loading past records...</div>
      ) : historyList.length === 0 ? (
        <div className="history-empty-state glass-panel">
          <Calendar size={40} className="empty-icon" />
          <h3>No past records found</h3>
          <p>Mark attendance or seed demo data to see monthly summaries here.</p>
        </div>
      ) : (
        <div className="history-cards-grid">
          {historyList.map((item) => {
            const isPaid = !!item.is_paid;
            return (
              <div 
                key={`${item.year}-${item.month}`}
                className="history-month-card glass-panel"
                onClick={() => onSelectMonth(item.month, item.year)}
                role="button"
                tabIndex={0}
              >
                <div className="month-card-header">
                  <div>
                    <h3 className="card-month-title">{item.month_name} {item.year}</h3>
                    <span className="card-meals-count">{item.total_meals} total meals</span>
                  </div>
                  <span className={`status-badge-sm ${isPaid ? 'paid' : 'unpaid'}`}>
                    {isPaid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    <span>{isPaid ? 'PAID' : 'DUE'}</span>
                  </span>
                </div>

                <div className="month-card-stats">
                  <div className="stat-pill">
                    <Sun size={14} className="icon-lunch" />
                    <span>{item.lunch_count} lunches</span>
                    <span className="rate-text">(@₹{item.lunch_price})</span>
                  </div>
                  <div className="stat-pill">
                    <Moon size={14} className="icon-dinner" />
                    <span>{item.dinner_count} dinners</span>
                    <span className="rate-text">(@₹{item.dinner_price})</span>
                  </div>
                </div>

                <div className="month-card-footer">
                  <div className="bill-total-tag">
                    <span className="label">Total:</span>
                    <span className="value">₹{item.total_amount?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="view-btn-wrap">
                    <span>Inspect</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
