import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstallBanner from './components/InstallBanner';
import UpdateNotification from './components/UpdateNotification';
import Home from './pages/Home';
import About from './pages/About';
import Standards from './pages/Standards';
import Category from './pages/Category';
import Friends from './pages/Friends';

const PdfViewer = lazy(() => import('./pages/PdfViewer'));

export default function App() {
  const [bannerVisible, setBannerVisible] = useState(false);

  return (
    <Layout hasInstallBanner={bannerVisible}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/standards/:categoryId" element={<Category />} />
        <Route path="/friends" element={<Friends />} />
        <Route
          path="/viewer"
          element={
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100dvh',
                    color: '#5A7268',
                  }}
                >
                  Загрузка…
                </div>
              }
            >
              <PdfViewer />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <InstallBanner onVisibilityChange={setBannerVisible} />
      <UpdateNotification />
    </Layout>
  );
}
