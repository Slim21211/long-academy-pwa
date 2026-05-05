import { type ReactNode } from 'react';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
  hasInstallBanner?: boolean;
}

export default function Layout({ children, hasInstallBanner = false }: LayoutProps) {
  return (
    <div className={`${styles.layout} ${hasInstallBanner ? styles.withBanner : ''}`}>
      {children}
    </div>
  );
}
