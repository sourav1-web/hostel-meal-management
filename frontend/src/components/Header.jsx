import React from 'react';
import { 
  UtensilsCrossed, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Receipt, 
  Sliders, 
  History, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Header({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  billData, 
  activeTab, 
  setActiveTab,
  onSeedDemo,
  loadingSeed
}) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const navItems = [
    { id: 'daily', label: 'Daily Mark', icon: UtensilsCrossed },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'bill', label: 'Bill & Summary', icon: Receipt },
    { id: 'prices', label: 'Prices', icon: Sliders },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <header className="header-container">
      {/* Top Bar */}
      <div className="header-top">
        {/* Brand */}
        <div className="header-brand">
          <div className="brand-logo-icon">
            <UtensilsCrossed size={22} className="logo-svg" />
          </div>
          <div>
            <h1 className="brand-title">MessMate</h1>
            <p className="brand-subtitle">Hostel Meal & Attendance</p>
          </div>
        </div>

        {/* Month Selector Pill */}
        <div className="month-selector-wrapper">
          <button 
            onClick={handlePrevMonth} 
            className="month-nav-btn"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="month-display">
            <span className="month-name">{monthNames[selectedMonth - 1]}</span>
            <span className="year-name">{selectedYear}</span>
          </div>

          <button 
            onClick={handleNextMonth} 
            className="month-nav-btn"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Quick Month Metrics & Demo Button */}
        <div className="header-actions">
          {billData && (
            <div className="bill-quick-badge" onClick={() => setActiveTab('bill')} title="Click to view detailed bill">
              <span className="badge-label">This Month:</span>
              <span className="badge-value">₹{billData.grand_total?.toLocaleString('en-IN')}</span>
              <span className="badge-count">({billData.total_meals} meals)</span>
              {billData.payment?.is_paid ? (
                <span className="status-dot paid" title="Paid"><CheckCircle2 size={13} /></span>
              ) : (
                <span className="status-dot unpaid" title="Unpaid"><AlertCircle size={13} /></span>
              )}
            </div>
          )}

          <button 
            onClick={onSeedDemo} 
            disabled={loadingSeed}
            className="btn-seed-demo"
            title="Load realistic sample data for demo"
          >
            <Sparkles size={14} className={loadingSeed ? 'spin' : ''} />
            <span className="btn-text">{loadingSeed ? 'Seeding...' : 'Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Desktop / Laptop Tabs */}
      <nav className="desktop-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === 'bill' && billData && !billData.payment?.is_paid && billData.grand_total > 0 && (
                <span className="tab-pill-unpaid">Due</span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
