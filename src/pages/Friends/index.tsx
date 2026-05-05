import Header from '../../components/Header';
import { PHOTO } from '../../data/links';
import styles from './Friends.module.scss';

export default function Friends() {
  return (
    <div className={`${styles.page} page-enter`}>
      <Header title="Приведи друга" showBack backPath="/" />

      <main className={styles.main}>
        <div className={styles.imageCard}>
          <img
            src={PHOTO.FRIENDS}
            alt="Реферальная программа — Приведи друга"
            className={styles.image}
            loading="lazy"
          />
        </div>

        <div className={styles.info}>
          <h2 className={styles.heading}>Реферальная программа</h2>
          <p className={styles.text}>
            Приведи друга или знакомого, который хочет работать в нашей команде, и получи вознаграждение. Подробности — у вашего руководителя.
          </p>
        </div>
      </main>
    </div>
  );
}
