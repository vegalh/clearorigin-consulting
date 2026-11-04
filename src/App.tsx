import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { AppDataProvider } from '@/state/AppDataContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import { RequireRole } from '@/components/auth/RequireRole';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/Home/HomePage';
import { CoursesPage } from '@/pages/Courses/CoursesPage';
import { InstructorsPage } from '@/pages/Instructors/InstructorsPage';
import { InstructorProfilePage } from '@/pages/InstructorProfile/InstructorProfilePage';
import { BookPage } from '@/pages/Book/BookPage';
import { CheckoutPage } from '@/pages/Checkout/CheckoutPage';
import { BookingSuccessPage } from '@/pages/BookingSuccess/BookingSuccessPage';
import { MyBookingsPage } from '@/pages/MyBookings/MyBookingsPage';
import { FaqPage } from '@/pages/Faq/FaqPage';
import { InstructorDashboardPage } from '@/pages/InstructorDashboard/InstructorDashboardPage';
import { InstructorAvailabilityPage } from '@/pages/InstructorAvailability/InstructorAvailabilityPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { AccountPage } from '@/pages/Account/AccountPage';

/** v1 confirm links (`/booking/confirm?instructorId&sessionTypeId&startUtc&endUtc`) continue into the V3 Details step. */
function LegacyConfirmRedirect() {
  const [params] = useSearchParams();
  const next = new URLSearchParams();
  const instructor = params.get('instructorId');
  if (instructor) next.set('instructor', instructor);
  return <Navigate to={`/book?${next.toString()}`} replace />;
}

function App() {
  return (
    <I18nProvider>
      <AppDataProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/instructors" element={<InstructorsPage />} />
              <Route path="/instructors/:id" element={<InstructorProfilePage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/booking/confirm" element={<LegacyConfirmRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/account" element={<AccountPage />} />

              {/* Student area */}
              <Route path="/book/checkout/:bookingId" element={<RequireRole role="student"><CheckoutPage /></RequireRole>} />
              <Route path="/booking/success/:id" element={<RequireRole role="student"><BookingSuccessPage /></RequireRole>} />
              <Route path="/bookings" element={<RequireRole role="student"><MyBookingsPage /></RequireRole>} />

              {/* Instructor area */}
              <Route path="/instructor/dashboard" element={<RequireRole role="instructor"><InstructorDashboardPage /></RequireRole>} />
              <Route path="/instructor/availability" element={<RequireRole role="instructor"><InstructorAvailabilityPage /></RequireRole>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </I18nProvider>
  );
}

export default App;
