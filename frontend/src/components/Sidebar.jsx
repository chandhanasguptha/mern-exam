import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Briefcase, 
  LayoutDashboard, 
  PlusCircle, 
  Database,
  ExternalLink,
  Layers
} from 'lucide-react';
import { applicationService } from '../services/api';

export default function Sidebar({ isOpen, onClose, onOpenAddModal }) {
  const [dbStatus, setDbStatus] = useState({ state: 'checking', isMemoryDb: false });

  useEffect(() => {
    let isMounted = true;
    applicationService.checkHealth()
      .then(res => {
        if (isMounted && res.data?.database) {
          setDbStatus(res.data.database);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDbStatus({ state: 'disconnected', isMemoryDb: false });
        }
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Briefcase size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="sidebar-title">JobPulse</span>
              <span className="sidebar-badge">MERN</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Application Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <button 
            type="button" 
            className="nav-link" 
            style={{ width: '100%', textAlign: 'left', marginTop: '0.5rem', color: '#38bdf8' }}
            onClick={() => {
              onClose?.();
              onOpenAddModal?.();
            }}
          >
            <PlusCircle size={18} />
            + New Application
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="health-indicator">
            <span className={`status-dot ${dbStatus.state === 'connected' ? '' : 'down'}`} />
            <div>
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>
                {dbStatus.state === 'connected' ? 'MongoDB Active' : 'DB Connecting...'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {dbStatus.isMemoryDb ? 'Memory / Test Cluster' : (dbStatus.host || 'MongoDB Atlas')}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
