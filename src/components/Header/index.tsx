import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backPath?: string;
  subtitle?: string;
}

function ArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="#2D7A50"/>
      <path d="M50 18 C50 18 28 30 28 52 C28 66 38 76 50 78 C62 76 72 66 72 52 C72 30 50 18 50 18Z" fill="white" opacity="0.95"/>
      <line x1="50" y1="78" x2="50" y2="42" stroke="#2D7A50" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="62" x2="38" y2="48" stroke="#2D7A50" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="54" x2="62" y2="40" stroke="#2D7A50" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function Header({ title, showBack = false, backPath, subtitle }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {showBack ? (
          <button className={styles.backBtn} onClick={handleBack} aria-label="Назад">
            <ArrowLeft />
          </button>
        ) : (
          <div className={styles.logoWrap}>
            <LeafIcon />
          </div>
        )}

        <div className={styles.titleWrap}>
          <h1 className={styles.title}>{title ?? 'Академия Долголетия'}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {/* Spacer to balance back button */}
        <div className={styles.spacer} />
      </div>
    </header>
  );
}
