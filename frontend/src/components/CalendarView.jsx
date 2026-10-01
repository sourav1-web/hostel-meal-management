import React from 'react';
import { 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Check, 
  MessageSquare,
  HelpCircle 
} from 'lucide-react';

export default function CalendarView({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  billData, 
  onDayClick,
  onQuickToggle
}) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calculate days in month and starting day of week
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

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

  // Generate calendar cells
  const cells = [];
  // Empty padding cells before 1st day
  for (let i = 0; i < firstDay; i++) {
    cells.push({ type: 'empty', id: `empty-${i}` });
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = billData?.daily_map?.[dateStr];
    const isToday = dateStr === todayStr;

    const lunchTaken = !!rec?.lunch_taken;
    const dinnerTaken = !!rec?.dinner_taken;
    const hasNote = !!rec?.note;

    let dayCost = 0;
    if (lunchTaken) dayCost += (billData?.lunch_price || 0);
    if (dinnerTaken) dayCost += (billData?.dinner_price || 0);

    cells.push({
      type: 'day',
      dayNumber: d,
      dateStr,
      isToday,
      lunchTaken,
      dinnerTaken,
      hasNote,
      note: rec?.note || '',
      dayCost,
    });
  }

  return (
    <div className="calendar-container animate-fade-in">
      {/* Calendar Header with navigation */}
      <div className="calendar-header-card glass-panel">
        <div className="calendar-title-group">
          <div className="calendar-icon-box">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="calendar-month-heading">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h2>
            <p className="calendar-subheading">
              {billData?.total_meals || 0} meals taken • ₹{billData?.grand_total || 0} total
            </p>
          </div>
        </div>

        <div className="calendar-nav-controls">
          <button onClick={handlePrevMonth} className="btn-icon-nav" aria-label="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <span className="current-period-tag">{monthNames[selectedMonth - 1].slice(0, 3)} {selectedYear}</span>
          <button onClick={handleNextMonth} className="btn-icon-nav" aria-label="Next Month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="calendar-legend-bar">
        <div className="legend-item">
          <span className="legend-badge lunch-badge">L</span>
          <span>Lunch (₹{billData?.lunch_price || 0})</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge dinner-badge">D</span>
          <span>Dinner (₹{billData?.dinner_price || 0})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot note-dot"></span>
          <span>Has Note</span>
        </div>
        <div className="legend-item">
          <span className="legend-chip-today">TODAY</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid-card glass-panel">
        {/* Weekday headers */}
        <div className="calendar-weekdays-row">
          {daysOfWeek.map((day) => (
            <div key={day} className="weekday-cell">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="calendar-days-grid">
          {cells.map((cell) => {
            if (cell.type === 'empty') {
              return <div key={cell.id} className="calendar-day-cell empty-cell" />;
            }

            const { dayNumber, dateStr, isToday, lunchTaken, dinnerTaken, hasNote, note, dayCost } = cell;
            const bothTaken = lunchTaken && dinnerTaken;
            const noneTaken = !lunchTaken && !dinnerTaken;

            return (
              <div
                key={dateStr}
                onClick={() => onDayClick(dateStr)}
                className={`calendar-day-cell active-day-cell ${isToday ? 'today-cell' : ''} ${bothTaken ? 'both-taken' : ''}`}
                role="button"
                tabIndex={0}
                title={`Click to edit ${dateStr}`}
              >
                <div className="day-cell-top">
                  <span className={`day-number ${isToday ? 'today-badge' : ''}`}>{dayNumber}</span>
                  {dayCost > 0 && <span className="day-cost">₹{dayCost}</span>}
                </div>

                <div className="day-meal-indicators">
                  {/* Lunch Badge */}
                  <span className={`meal-indicator ${lunchTaken ? 'indicator-lunch-on' : 'indicator-off'}`}>
                    L
                  </span>

                  {/* Dinner Badge */}
                  <span className={`meal-indicator ${dinnerTaken ? 'indicator-dinner-on' : 'indicator-off'}`}>
                    D
                  </span>
                </div>

                {hasNote && (
                  <div className="cell-note-pill" title={note}>
                    <MessageSquare size={10} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-footer-hint">
        💡 Tap any day on the calendar to edit Lunch, Dinner, or custom notes.
      </div>
    </div>
  );
}
