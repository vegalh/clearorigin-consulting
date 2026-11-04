import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from '@/state/AppDataContext';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/Home/HomePage';
import { InstructorsPage } from '@/pages/Instructors/InstructorsPage';
import { InstructorProfilePage } from '@/pages/InstructorProfile/InstructorProfilePage';
import { BookingConfirmationPage } from '@/pages/BookingConfirmation/BookingConfirmationPage';
import { BookingSuccessPage } from '@/pages/BookingSuccess/BookingSuccessPage';
import { MyBookingsPage } from '@/pages/MyBookings/MyBookingsPage';
import { InstructorDashboardPage } from '@/pages/InstructorDashboard/InstructorDashboardPage';
import { InstructorAvailabilityPage } from '@/pages/InstructorAvailability/InstructorAvailabilityPage';

function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/instructors/:id" element={<InstructorProfilePage />} />
            <Route path="/booking/confirm" element={<BookingConfirmationPage />} />
            <Route path="/booking/success/:id" element={<BookingSuccessPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/instructor/dashboard" element={<InstructorDashboardPage />} />
            <Route path="/instructor/availability" element={<InstructorAvailabilityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default App;
