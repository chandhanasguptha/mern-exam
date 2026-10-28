import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ApplicationFormModal from './components/ApplicationFormModal';
import Dashboard from './pages/Dashboard';
import ApplicationDetails from './pages/ApplicationDetails';
import { ToastProvider, useToast } from './components/Toast';
import { applicationService } from './services/api';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalAddOpen, setIsGlobalAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const { addToast } = useToast();

  const handleCreateSubmit = async (payload) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const res = await applicationService.createApplication(payload);
      addToast(`Application for ${res.data.company} created! (ID: ${res.data.applicationId})`, 'success');
      setIsGlobalAddOpen(false);
      // Reload or trigger update
      window.dispatchEvent(new CustomEvent('application-created'));
    } catch (err) {
      setServerError(err.message || 'Failed to create application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onOpenAddModal={() => setIsGlobalAddOpen(true)}
      />

      <div className="main-content">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenAddModal={() => setIsGlobalAddOpen(true)}
        />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
        </Routes>
      </div>

      <ApplicationFormModal
        isOpen={isGlobalAddOpen}
        onClose={() => {
          setIsGlobalAddOpen(false);
          setServerError('');
        }}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}
