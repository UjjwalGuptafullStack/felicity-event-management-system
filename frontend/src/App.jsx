import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

//Public pages
import Home from './pages/Home';
import Register from './pages/auth/Register';
import ParticipantLogin from './pages/auth/ParticipantLogin';
import OrganizerLogin from './pages/auth/OrganizerLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLogin from './pages/auth/AdminLogin';

// Participant pages
import ParticipantDashboard from './pages/participant/NewDashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import Profile from './pages/participant/Profile';
import Organizers from './pages/participant/Organizers';
import OrganizerDetail from './pages/participant/OrganizerDetail';
import Onboarding from './pages/participant/Onboarding';
import TeamsPage from './pages/participant/Teams';
import TeamChat from './pages/participant/TeamChat';
import EventDiscussion from './pages/participant/EventDiscussion';

// Organizer pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerEvents from './pages/organizer/Events';
import OrganizerEventDetail from './pages/organizer/EventDetail';
import OrganizerProfile from './pages/organizer/Profile';
import MerchandiseApprovals from './pages/organizer/MerchandiseApprovals';
import AttendanceScanner from './pages/organizer/AttendanceScanner';
import Analytics from './pages/organizer/Analytics';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';

// Route protection
import RoleRoute from './routes/RoleRoute';

// Layouts
import { ParticipantLayout } from './layouts/ParticipantLayout';
import { OrganizerLayout } from './layouts/OrganizerLayout';

import './App.css';

function AppRoutes() {
  const { isAuthenticated, actorType, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login/participant" element={<ParticipantLogin />} />
      <Route path="/login/organizer" element={<OrganizerLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/login/admin" element={<AdminLogin />} />

      {/* Participant Onboarding - protected but no layout */}
      <Route
        path="/participant/onboarding"
        element={
          <RoleRoute allowedActorType="user" allowedRole="participant">
            <Onboarding />
          </RoleRoute>
        }
      />

      {/* Participant Routes - Nested under Layout */}
      <Route 
        path="/participant"
        element={
          <RoleRoute allowedActorType="user" allowedRole="participant">
            <ParticipantLayout />
          </RoleRoute>
        }
      >
        <Route path="dashboard" element={<ParticipantDashboard />} />
        <Route path="browse-events" element={<BrowseEvents />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="organizers" element={<Organizers />} />
        <Route path="organizers/:id" element={<OrganizerDetail />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:teamId/chat" element={<TeamChat />} />
        <Route path="events/:id/discussion" element={<EventDiscussion />} />
      </Route>

      {/* Legacy routes - redirect to new structure */}
      <Route path="/dashboard" element={<Navigate to="/participant/dashboard" replace />} />
      <Route path="/events" element={<Navigate to="/participant/browse-events" replace />} />
      <Route path="/events/:id" element={<Navigate to="/participant/events/:id" replace />} />

      {/* Organizer Routes - Nested under Layout */}
      <Route
        path="/organizer"
        element={
          <RoleRoute allowedActorType="organizer">
            <OrganizerLayout />
          </RoleRoute>
        }
      >
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="events" element={<OrganizerEvents />} />
        <Route path="events/:id/detail" element={<OrganizerEventDetail />} />
        <Route path="ongoing-events" element={<OrganizerEvents />} />
        <Route path="profile" element={<OrganizerProfile />} />
        <Route path="merchandise-approvals" element={<MerchandiseApprovals />} />
        <Route path="attendance/:eventId" element={<AttendanceScanner />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedActorType="user" allowedRole="admin">
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/organizers"
        element={
          <RoleRoute allowedActorType="user" allowedRole="admin">
            <ManageOrganizers />
          </RoleRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
