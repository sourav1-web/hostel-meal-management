import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Receipt, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  Printer, 
  Sparkles,
  Sliders,
  DollarSign,
  Share2
} from 'lucide-react';
import { api } from '../api';

export default function BillSummaryCard({ 
  billData, 
  onTogglePayment, 
  onNavigateToTab 
}) {
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(billData?.payment?.payment_method || 'UPI');
  const [paymentNote, setPaymentNote] = useState(billData?.payment?.payment_note || '');
  const [showPaymentDetailsEdit, setShowPaymentDetailsEdit] = useState(false);

  const isPaid = !!billData?.payment?.is_paid;

  const handleTogglePaymentStatus = async () => {
    setIsUpdatingPayment(true);
    try {
      const nextStatus = !isPaid;
      await onTogglePayment(nextStatus, paymentMethod, paymentNote);
      
      if (nextStatus) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899']
        });
      }
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleSavePaymentDetails = async (e) => {
    e.preventDefault();
    setIsUpdatingPayment(true);
    try {
      await onTogglePayment(isPaid, paymentMethod, paymentNote);
      setShowPaymentDetailsEdit(false);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const csvDownloadUrl = api.getExportCsvUrl(billData?.month, billData?.year);

  return (
    <div className="bill-summary-container animate-fade-in">
      {/* Top Banner / Price warning if not set */}
      {!billData?.is_price_set && (
        <div className="warning-banner glass-panel">
          <AlertCircle size={20} className="warning-icon" />
          <div className="warning-text">
            <h4>Meal prices are not configured for this month!</h4>
            <p>Calculations are using default ₹0. Set prices to calculate the exact bill.</p>
          </div>
          <button 
            type="button" 
            onClick={() => onNavigateToTab('prices')}
            className="btn-primary btn-sm"
          >
            <Sliders size={15} />
            <span>Set Prices</span>
          </button>
        </div>
      )}

      <div className="bill-content-layout">
        {/* Printable Receipt Card */}
        <div className="receipt-card glass-panel printable-area">
          <div className="receipt-header">
            <div className="receipt-badge">
              <Receipt size={16} />
              <span>OFFICIAL INVOICE</span>
            </div>
            <h3 className="receipt-title">Hostel Mess Bill</h3>
            <p className="receipt-period">
              {billData?.month_name} {billData?.year}
            </p>
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Breakdown Table */}
          <div className="receipt-items-list">
            {/* Lunch Row */}
            <div className="receipt-item-row">
              <div className="item-info">
                <span className="item-name">Lunch Meals</span>
                <span className="item-rate">
                  {billData?.total_lunches || 0} meals × ₹{billData?.lunch_price || 0}
                </span>
              </div>
              <div className="item-total">
                ₹{billData?.lunch_amount?.toLocaleString('en-IN') || 0}
              </div>
            </div>

            {/* Dinner Row */}
            <div className="receipt-item-row">
              <div className="item-info">
                <span className="item-name">Dinner Meals</span>
                <span className="item-rate">
                  {billData?.total_dinners || 0} meals × ₹{billData?.dinner_price || 0}
                </span>
              </div>
              <div className="item-total">
                ₹{billData?.dinner_amount?.toLocaleString('en-IN') || 0}
              </div>
            </div>

            <div className="receipt-divider-solid"></div>

            {/* Total Row */}
            <div className="receipt-total-row">
              <div className="total-label-group">
                <span className="total-title">Total Amount Payable</span>
                <span className="total-meals-sub">
                  Total Meals Taken: {billData?.total_meals || 0} / {billData?.days_in_month * 2} possible
                </span>
              </div>
              <div className="total-amount-display">
                ₹{billData?.grand_total?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Payment Status In Receipt */}
          <div className="receipt-status-section">
            <div className="status-indicator-box">
              <span className="status-label">Payment Status</span>
              <span className={`status-badge-lg ${isPaid ? 'paid' : 'unpaid'}`}>
                {isPaid ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{isPaid ? 'PAID' : 'UNPAID / DUE'}</span>
              </span>
            </div>

            {isPaid && billData?.payment?.paid_date && (
              <div className="payment-metadata">
                <div>Paid on: <strong>{billData.payment.paid_date}</strong></div>
                <div>Method: <strong>{billData.payment.payment_method || 'UPI'}</strong></div>
                {billData.payment.payment_note && (
                  <div>Ref: <em>{billData.payment.payment_note}</em></div>
                )}
              </div>
            )}
          </div>

          <div className="receipt-footer">
            <p>Generated automatically based on actual daily meal attendance.</p>
            <p className="rules-note">Rule: Bill = (Lunches × Price) + (Dinners × Price)</p>
          </div>
        </div>

        {/* Right Side: Action Controls */}
        <div className="bill-actions-column">
          {/* Payment Management Card */}
          <div className="payment-control-card glass-panel">
            <h4 className="card-section-title">
              <CreditCard size={18} />
              <span>Payment Action</span>
            </h4>

            <div className="status-summary-box">
              <p className="status-summary-text">
                Current status: <strong className={isPaid ? 'text-success' : 'text-danger'}>
                  {isPaid ? 'Marked as Paid' : 'Payment Due'}
                </strong>
              </p>

              <button
                type="button"
                onClick={handleTogglePaymentStatus}
                disabled={isUpdatingPayment}
                className={`btn-toggle-payment ${isPaid ? 'btn-mark-unpaid' : 'btn-mark-paid'}`}
              >
                {isPaid ? (
                  <>
                    <AlertCircle size={18} />
                    <span>Change to Unpaid</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Mark as Paid (₹{billData?.grand_total || 0})</span>
                  </>
                )}
              </button>
            </div>

            {/* Toggle edit payment details */}
            <div className="payment-details-toggle">
              <button 
                type="button"
                onClick={() => setShowPaymentDetailsEdit(!showPaymentDetailsEdit)}
                className="btn-link-subtle"
              >
                {showPaymentDetailsEdit ? 'Hide Payment Details' : 'Edit Payment Method & Reference'}
              </button>
            </div>

            {showPaymentDetailsEdit && (
              <form onSubmit={handleSavePaymentDetails} className="payment-edit-form animate-fade-in">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="select-input"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction ID / Note</label>
                  <input 
                    type="text" 
                    placeholder="e.g. UPI Ref #489274, Given to mess manager"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="text-input"
                  />
                </div>

                <button type="submit" disabled={isUpdatingPayment} className="btn-secondary btn-full">
                  Save Details
                </button>
              </form>
            )}
          </div>

          {/* Export & Print Card */}
          <div className="export-card glass-panel">
            <h4 className="card-section-title">
              <Download size={18} />
              <span>Export & Share</span>
            </h4>

            <div className="export-buttons-group">
              <a 
                href={csvDownloadUrl} 
                download
                className="btn-secondary btn-full"
                title="Download comprehensive CSV spreadsheet"
              >
                <Download size={16} />
                <span>Download CSV Report</span>
              </a>

              <button 
                type="button" 
                onClick={handlePrint}
                className="btn-secondary btn-full"
                title="Print or Save as PDF"
              >
                <Printer size={16} />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
