import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import styles from './Home.module.scss';

const MENU_ITEMS = [
  {
    id: 'about',
    path: '/about',
    icon: '🏢',
    title: 'О Компании',
    desc: 'Видео, миссия и ценности',
    accent: '#2D7A50',
    bg: '#EBF5EE',
  },
  {
    id: 'standards',
    path: '/standards',
    icon: '📋',
    title: 'Стандарты работы',
    desc: 'СОПы, чек-листы, документы',
    accent: '#5B8DB8',
    bg: '#EBF3FA',
  },
  {
    id: 'friends',
    path: '/friends',
    icon: '👥',
    title: 'Приведи друга',
    desc: 'Реферальная программа',
    accent: '#E07B3A',
    bg: '#FDF0E8',
  },
] as const;

function ChevronRight() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={`${styles.page} page-enter`}>
      <Header />

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroText}>
            Добро пожаловать в корпоративную базу знаний. Здесь вы найдёте все
            документы и материалы, необходимые для работы.
          </p>
        </section>

        <nav className={styles.menu} aria-label="Разделы">
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.id}
              className={styles.card}
              onClick={() => navigate(item.path)}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={styles.cardIcon}
                style={{ background: item.bg, color: item.accent }}
              >
                <span role="img" aria-hidden="true">
                  {item.icon}
                </span>
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardDesc}>{item.desc}</span>
              </div>
              <div className={styles.cardArrow} style={{ color: item.accent }}>
                <ChevronRight />
              </div>
            </button>
          ))}
        </nav>

        {/* <button className={styles.debugLink} onClick={() => navigate('/debug')}>
          🔧 Диагностика
        </button> */}
      </main>
    </div>
  );
}
