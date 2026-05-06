import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdateNotification.module.scss';

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Проверяем обновления каждые 60 минут пока приложение открыто
    onRegisteredSW(_swUrl, r) {
      if (r) {
        setInterval(() => void r.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className={styles.banner} role="alert">
      <div className={styles.content}>
        <span className={styles.icon}>🔄</span>
        <p className={styles.text}>Доступна новая версия</p>
      </div>
      <button
        className={styles.btn}
        onClick={() => void updateServiceWorker(true)}
      >
        Обновить
      </button>
    </div>
  );
}
