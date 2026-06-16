import { useAuth } from '../../../hooks/useAuth';
import SearchBar from '../../common/SearchBar/SearchBar';
import styles from './Header.module.css';

export default function Header() {
  const { userProfile } = useAuth();
  return (
    <header className={styles.header}>
      <SearchBar />
      <div className={styles.user}>
        <span>{userProfile?.name || 'Usuário'}</span>
      </div>
    </header>
  );
}
