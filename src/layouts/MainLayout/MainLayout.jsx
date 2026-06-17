import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/navigation/Sidebar/Sidebar';
import Header from '../../components/navigation/Header/Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header onMenuClick={toggleSidebar} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-secondary)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
