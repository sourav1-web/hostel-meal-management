import React from 'react';
import { 
  UtensilsCrossed, 
  Calendar as CalendarIcon, 
  Receipt, 
  Sliders, 
  History 
} from 'lucide-react';

export default function MobileNav({ activeTab, setActiveTab, billData }) {
  const items = [
    { id: 'daily', label: 'Mark', icon: UtensilsCrossed },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'bill', label: 'Bill', icon: Receipt, badge: billData && !billData.payment?.is_paid && billData.grand_total > 0 ? '₹' : null },
    { id: 'prices', label: 'Prices', icon: Sliders },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            aria-label={item.label}
          >
            <div className="icon-wrapper">
              <Icon size={20} />
              {item.badge && <span className="mobile-tab-badge">{item.badge}</span>}
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
