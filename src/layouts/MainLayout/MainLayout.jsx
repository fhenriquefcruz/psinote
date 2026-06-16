import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/navigation/Sidebar/Sidebar';
import Header from '../../components/navigation/Header/Header';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
