import { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Header from '../../components/Header';
import DocCard from '../../components/DocCard';
import { PDF_CATEGORIES } from '../../data/links';
import styles from './Category.module.scss';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function Category() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [search, setSearch] = useState('');

  const category = PDF_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return <Navigate to="/standards" replace />;

  // Only show search for large lists
  const showSearch = category.documents.length > 6;

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return category.documents;
    const q = search.toLowerCase();
    return category.documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [category.documents, search]);

  return (
    <div className={`${styles.page} page-enter`}>
      <Header
        title={category.title}
        showBack
        backPath="/standards"
        subtitle={`${category.documents.length} документ${docSuffix(category.documents.length)}`}
      />

      <main className={styles.main}>
        {showSearch && (
          <div className={styles.searchWrap}>
            <div className={styles.searchIcon}><SearchIcon /></div>
            <input
              type="search"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
              aria-label="Поиск документов"
            />
            {search && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearch('')}
                aria-label="Очистить поиск"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        )}

        {filteredDocs.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔍</p>
            <p className={styles.emptyText}>Ничего не найдено</p>
            <p className={styles.emptyHint}>Попробуйте изменить запрос</p>
          </div>
        ) : (
          <ul className={styles.list} role="list">
            {filteredDocs.map((doc, i) => (
              <li key={doc.id} role="listitem">
                <DocCard name={doc.name} url={doc.url} index={i} />
              </li>
            ))}
          </ul>
        )}
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
