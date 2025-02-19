import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Experiences } from './pages/Experiences';
import { Creators } from './pages/Creators';
import { CreatorProfile } from './pages/creators/[id]';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Apply } from './pages/Apply';
import { Settings } from './pages/profile/Settings';
import { Profile } from './pages/profile/Profile';
import { AdminLayout } from './pages/admin/Layout';
import { AdminOverviewPage } from './pages/admin/Overview';
import { UserApprovals } from './components/admin/UserApprovals';
import { ExperienceApprovals } from './components/admin/ExperienceApprovals';
import { AdminActionLog } from './components/admin/AdminActionLog';
import { CreatorDashboard } from './pages/creator/Dashboard';
import { CreateExperience } from './pages/creator/CreateExperience';
import { EditExperience } from './pages/creator/EditExperience';
import { ExperiencesList } from './pages/creator/ExperiencesList';
import { BookExperience } from './pages/experiences/[id]/book';
import { ExperienceDetails } from './pages/experiences/[id]';
import { Bookings } from './pages/Bookings';
import { Messages } from './pages/Messages';
import { Privacy } from './pages/legal/Privacy';
import { Terms } from './pages/legal/Terms';
import { Cookies } from './pages/legal/Cookies';
import { initAuth } from '@/lib/auth';

// Admin route guard component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  React.useEffect(() => {
    initAuth();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-earth-900 text-sand-50">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/experiences/:id" element={<ExperienceDetails />} />
            <Route path="/experiences/:id/book" element={<BookExperience />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/creators/:id" element={<CreatorProfile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/apply/:type" element={<Apply />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<AdminOverviewPage />} />
              <Route path="users" element={<UserApprovals />} />
              <Route path="experiences" element={<ExperienceApprovals />} />
              <Route path="activity" element={<AdminActionLog />} />
            </Route>

            <Route path="/creator/dashboard" element={<CreatorDashboard />} />
            <Route path="/creator/experiences/new" element={<CreateExperience />} />
            <Route path="/creator/experiences/:id/edit" element={<EditExperience />} />
            <Route path="/bookings" element={<Bookings />} />

            {/* Legal Pages */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}