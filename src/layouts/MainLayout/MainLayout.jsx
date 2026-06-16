import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/navigation/Sidebar/Sidebar';
import Header from '../../components/navigation/Header/Header';

export default function MainLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-secondary, #f1f5f9)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
