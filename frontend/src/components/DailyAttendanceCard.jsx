import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Check, 
  Calendar as CalendarIcon, 
  StickyNote, 
  ArrowRight, 
  Clock, 
  Sparkles,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function DailyAttendanceCard({ 
  currentDateStr, 
  onDateChange, 
  dailyRecord, 
  billData, 
  onToggleMeal, 
  onSaveNote, 
  onNavigateToTab 
}) {
  const [note, setNote] = useState(dailyRecord?.note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    setNote(dailyRecord?.note || '');
  }, [dailyRecord?.note, currentDateStr]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for yesterday
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  // Helper for tomorrow
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const handleNoteBlur = async () => {
    if (note !== (dailyRecord?.note || '')) {
      setIsSavingNote(true);
      await onSaveNote(currentDateStr, note);
      setIsSavingNote(false);
      triggerSuccess();
    }
  };

  const triggerSuccess = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  const handleToggle = async (mealType) => {
    await onToggleMeal(currentDateStr, mealType);
    triggerSuccess();
  };

  // Format date display (e.g. Thursday, 01 Oct 2026)
  const dateObj = new Date(currentDateStr + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const isToday = currentDateStr === todayStr;
  const isYesterday = currentDateStr === yesterdayStr;

  const lunchTaken = !!dailyRecord?.lunch_taken;
  const dinnerTaken = !!dailyRecord?.dinner_taken;

  const lunchPrice = billData?.lunch_price || 0;
  const dinnerPrice = billData?.dinner_price || 0;

  const dailyCost = (lunchTaken ? lunchPrice : 0) + (dinnerTaken ? dinnerPrice : 0);

  return (
    <div className="daily-card-container animate-fade-in">
      {/* Date Navigation & Selector */}
      <div className="daily-header-card glass-panel">
        <div className="date-main-info">
          <div className="date-icon-badge">
            <CalendarIcon size={20} />
          </div>
          <div>
            <div className="date-chip-row">
              {isToday && <span className="chip chip-today">TODAY</span>}
              {isYesterday && <span className="chip chip-yesterday">YESTERDAY</span>}
              <span className="date-cost-badge">Day Total: ₹{dailyCost}</span>
            </div>
            <h2 className="current-date-heading">{formattedDate}</h2>
          </div>
        </div>

        {/* Quick Date Pills */}
        <div className="quick-dates-bar">
          <button 
            type="button"
            className={`quick-date-btn ${currentDateStr === yesterdayStr ? 'active' : ''}`}
            onClick={() => onDateChange(yesterdayStr)}
          >
            Yesterday
          </button>
          <button 
            type="button"
            className={`quick-date-btn ${currentDateStr === todayStr ? 'active' : ''}`}
            onClick={() => onDateChange(todayStr)}
          >
            Today
          </button>
          <button 
            type="button"
            className={`quick-date-btn ${currentDateStr === tomorrowStr ? 'active' : ''}`}
            onClick={() => onDateChange(tomorrowStr)}
          >
            Tomorrow
          </button>
          <label className="custom-date-picker-label" title="Pick specific date">
            <CalendarIcon size={16} />
            <input 
              type="date" 
              value={currentDateStr} 
              onChange={(e) => e.target.value && onDateChange(e.target.value)} 
              className="custom-date-input"
            />
          </label>
        </div>
      </div>

      {/* Instant Feedback Notice */}
      <div className={`save-status-bar ${saveSuccessNotice ? 'visible' : ''}`}>
        <CheckCircle size={15} />
        <span>Saved immediately to database</span>
      </div>

      {/* Main Meal Toggle Cards */}
      <div className="meal-toggles-grid">
        {/* Lunch Card */}
        <div 
          className={`meal-card lunch-card ${lunchTaken ? 'meal-active' : ''}`}
          onClick={() => handleToggle('lunch')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleToggle('lunch')}
        >
          <div className="meal-card-top">
            <div className="meal-icon-wrapper lunch-icon">
              <Sun size={28} />
            </div>
            <div className="meal-switch-toggle">
              <div className={`switch-track ${lunchTaken ? 'on' : ''}`}>
                <div className="switch-thumb">
                  {lunchTaken && <Check size={12} strokeWidth={3.5} />}
                </div>
              </div>
            </div>
          </div>

          <div className="meal-card-body">
            <div className="meal-name-row">
              <h3 className="meal-title">Lunch</h3>
              <span className="meal-price-tag">₹{lunchPrice}</span>
            </div>
            <p className="meal-subtext">Afternoon meal (12:30 PM - 2:30 PM)</p>
          </div>

          <div className="meal-card-footer">
            <span className={`status-pill ${lunchTaken ? 'taken' : 'skipped'}`}>
              {lunchTaken ? '✓ Taken' : '✕ Not Taken'}
            </span>
            <span className="tap-hint">Tap to switch</span>
          </div>
        </div>

        {/* Dinner Card */}
        <div 
          className={`meal-card dinner-card ${dinnerTaken ? 'meal-active' : ''}`}
          onClick={() => handleToggle('dinner')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleToggle('dinner')}
        >
          <div className="meal-card-top">
            <div className="meal-icon-wrapper dinner-icon">
              <Moon size={28} />
            </div>
            <div className="meal-switch-toggle">
              <div className={`switch-track ${dinnerTaken ? 'on' : ''}`}>
                <div className="switch-thumb">
                  {dinnerTaken && <Check size={12} strokeWidth={3.5} />}
                </div>
              </div>
            </div>
          </div>

          <div className="meal-card-body">
            <div className="meal-name-row">
              <h3 className="meal-title">Dinner</h3>
              <span className="meal-price-tag">₹{dinnerPrice}</span>
            </div>
            <p className="meal-subtext">Night meal (8:00 PM - 10:00 PM)</p>
          </div>

          <div className="meal-card-footer">
            <span className={`status-pill ${dinnerTaken ? 'taken' : 'skipped'}`}>
              {dinnerTaken ? '✓ Taken' : '✕ Not Taken'}
            </span>
            <span className="tap-hint">Tap to switch</span>
          </div>
        </div>
      </div>

      {/* Note & Quick Commentary */}
      <div className="daily-note-section glass-panel">
        <div className="note-input-container">
          <StickyNote size={18} className="note-icon" />
          <input
            type="text"
            placeholder="Add optional note (e.g. Ate canteen food, Home visit)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNoteBlur()}
            className="daily-note-input"
          />
          {isSavingNote && <span className="saving-text">Saving...</span>}
        </div>
      </div>

      {/* Running Monthly Overview Card */}
      <div className="month-overview-banner glass-panel">
        <div className="overview-left">
          <div className="sparkle-circle">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="overview-title">Month Running Total ({billData?.month_name} {billData?.year})</h4>
            <div className="overview-metrics-line">
              <span><strong>{billData?.total_lunches || 0}</strong> Lunches</span>
              <span className="separator">•</span>
              <span><strong>{billData?.total_dinners || 0}</strong> Dinners</span>
              <span className="separator">•</span>
              <span><strong>{billData?.total_meals || 0}</strong> Total Meals</span>
            </div>
          </div>
        </div>

        <div className="overview-right">
          <div className="bill-grand-amount">₹{billData?.grand_total?.toLocaleString('en-IN') || 0}</div>
          <button 
            type="button" 
            onClick={() => onNavigateToTab('bill')}
            className="btn-view-bill"
          >
            <span>View Receipt</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
