import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { PDF_CATEGORIES } from '../../data/links';
import styles from './Standards.module.scss';

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

export default function Standards() {
  const navigate = useNavigate();

  return (
    <div className={`${styles.page} page-enter`}>
      <Header title="Стандарты работы" showBack backPath="/" />

      <main className={styles.main}>
        <p className={styles.intro}>Выберите интересующий раздел</p>

        <nav className={styles.list} aria-label="Категории документов">
          {PDF_CATEGORIES.map((cat, i) => (
            <button
              key={cat.id}
              className={styles.card}
              onClick={() => navigate(`/standards/${cat.id}`)}
              style={{
                animationDelay: `${i * 70}ms`,
                '--accent': cat.color,
              } as React.CSSProperties}
            >
              <div className={styles.cardIcon} style={{ background: `${cat.color}1A`, color: cat.color }}>
                <span role="img" aria-hidden="true">{cat.icon}</span>
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>{cat.title}</span>
                <span className={styles.cardCount}>{cat.documents.length} документ{docSuffix(cat.documents.length)}</span>
              </div>
              <div className={styles.cardArrow}>
                <ChevronRight />
              </div>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}

function docSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 14) return 'ов';
  const m = n % 10;
  if (m === 1) return '';
  if (m >= 2 && m <= 4) return 'а';
  return 'ов';
}
