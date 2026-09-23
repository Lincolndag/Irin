import { Navigate, Route, Routes } from 'react-router-dom';
import SiteLayout from '../layouts/SiteLayout/SiteLayout';
import AboutPage from '../pages/AboutPage/AboutPage';
import AdminPage from '../pages/AdminPage/AdminPage';
import ContactPage from '../pages/ContactPage/ContactPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPasswordPage';
import LoginPage from '../pages/LoginPage/LoginPage';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage';
import PrivacyPage from '../pages/PrivacyPage/PrivacyPage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import BookingSuccessPage from '../pages/BookingSuccessPage/BookingSuccessPage';
import SignupPage from '../pages/SignupPage/SignupPage';
import TermsPage from '../pages/TermsPage/TermsPage';
import TourDetailPage from '../pages/TourDetailPage/TourDetailPage';
import ToursPage from '../pages/ToursPage/ToursPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Navigate to="/tours" replace />} />
        <Route path="tours" element={<ToursPage />} />
        <Route path="tours/:id" element={<TourDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="booking/success" element={<BookingSuccessPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
    </Routes>
  );
}
