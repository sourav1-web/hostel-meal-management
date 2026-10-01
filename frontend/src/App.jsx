import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import DailyAttendanceCard from './components/DailyAttendanceCard';
import CalendarView from './components/CalendarView';
import BillSummaryCard from './components/BillSummaryCard';
import PriceSettingsView from './components/PriceSettingsView';
import HistoryView from './components/HistoryView';
import EditDayModal from './components/EditDayModal';
import { api } from './api';
import './App.css';

export default function App() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [currentDateStr, setCurrentDateStr] = useState(now.toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('daily');

  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSeed, setLoadingSeed] = useState(false);

  // Modal editing
  const [editingDateStr, setEditingDateStr] = useState(null);

  const loadBillData = useCallback(async (month, year) => {
    try {
      const data = await api.getBill(month, year);
      setBillData(data);
    } catch (err) {
      console.error('Failed to load bill data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, loadBillData]);

  const handleMonthChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);

    // If changing month, set currentDateStr to 1st of that month if not the current month
    const curDate = new Date();
    if (month === curDate.getMonth() + 1 && year === curDate.getFullYear()) {
      setCurrentDateStr(curDate.toISOString().split('T')[0]);
    } else {
      setCurrentDateStr(`${year}-${String(month).padStart(2, '0')}-01`);
    }
  };

  const handleToggleMeal = async (dateStr, mealType) => {
    try {
      const res = await api.toggleMeal(dateStr, mealType);

      // Refresh bill data to get newly calculated sums
      await loadBillData(selectedMonth, selectedYear);
      return res;
    } catch (err) {
      alert('Failed to update meal: ' + err.message);
    }
  };

  const handleSaveNote = async (dateStr, note) => {
    try {
      const rec = billData?.daily_map?.[dateStr];
      const lunchTaken = !!rec?.lunch_taken;
      const dinnerTaken = !!rec?.dinner_taken;
      await api.saveAttendance(dateStr, lunchTaken, dinnerTaken, note);
      await loadBillData(selectedMonth, selectedYear);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleSavePrices = async (month, year, lunchPrice, dinnerPrice) => {
    await api.savePrices(month, year, lunchPrice, dinnerPrice);
    await loadBillData(month, year);
  };

  const handleTogglePayment = async (nextStatus, method, note) => {
    await api.updatePayment(selectedMonth, selectedYear, nextStatus, method, note);
    await loadBillData(selectedMonth, selectedYear);
  };

  const handleSeedDemo = async () => {
    setLoadingSeed(true);
    try {
      await api.seedDemo(selectedMonth, selectedYear);
      await loadBillData(selectedMonth, selectedYear);
    } catch (err) {
      alert('Failed to seed demo data: ' + err.message);
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleSaveModalAttendance = async (dateStr, lunchTaken, dinnerTaken, note) => {
    await api.saveAttendance(dateStr, lunchTaken, dinnerTaken, note);
    await loadBillData(selectedMonth, selectedYear);
  };

  const handleSelectHistoricalMonth = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setActiveTab('bill');
  };

  const dailyRecord = billData?.daily_map?.[currentDateStr];

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={handleMonthChange}
        billData={billData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSeedDemo={handleSeedDemo}
        loadingSeed={loadingSeed}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-container">
          {activeTab === 'daily' && (
            <DailyAttendanceCard
              currentDateStr={currentDateStr}
              onDateChange={setCurrentDateStr}
              dailyRecord={dailyRecord}
              billData={billData}
              onToggleMeal={handleToggleMeal}
              onSaveNote={handleSaveNote}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={handleMonthChange}
              billData={billData}
              onDayClick={(dateStr) => setEditingDateStr(dateStr)}
              onQuickToggle={handleToggleMeal}
            />
          )}

          {activeTab === 'bill' && (
            <BillSummaryCard
              billData={billData}
              onTogglePayment={handleTogglePayment}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'prices' && (
            <PriceSettingsView
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSavePrices={handleSavePrices}
              billData={billData}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              onSelectMonth={handleSelectHistoricalMonth}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        billData={billData}
      />

      {/* Quick Day Edit Modal */}
      {editingDateStr && (
        <EditDayModal
          dateStr={editingDateStr}
          record={billData?.daily_map?.[editingDateStr]}
          billData={billData}
          onSave={handleSaveModalAttendance}
          onClose={() => setEditingDateStr(null)}
        />
      )}
    </div>
  );
}
