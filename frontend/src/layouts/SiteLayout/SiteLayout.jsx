import { Outlet } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';
import Navbar from '../../components/Navbar/Navbar';

export default function SiteLayout() {
  return (
    <div className="site-layout">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

