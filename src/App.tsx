import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import InstallBanner from './components/InstallBanner';
import Home from './pages/Home';
import About from './pages/About';
import Standards from './pages/Standards';
import Category from './pages/Category';
import Friends from './pages/Friends';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <InstallBanner onVisibilityChange={setBannerVisible} />
    </Layout>
  );
}
