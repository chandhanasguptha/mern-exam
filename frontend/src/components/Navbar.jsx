import React from 'react';
import { Menu, Plus, Calendar } from 'lucide-react';

export default function Navbar({ onToggleSidebar, onOpenAddModal, title = "Application Dashboard" }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn-icon menu-toggle-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="navbar-title-section">
          <h1 className="navbar-page-title">{title}</h1>
        </div>
      </div>

      <div className="navbar-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#64748b' }}>
          <Calendar size={15} />
          <span>{currentDate}</span>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddModal}>
          <Plus size={16} />
          <span>Add Application</span>
        </button>
      </div>
    </header>
  );
}
