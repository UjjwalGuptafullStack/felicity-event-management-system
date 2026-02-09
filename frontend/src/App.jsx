import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

//Public pages
import Home from './pages/Home';
import Register from './pages/auth/Register';
import ParticipantLogin from './pages/auth/ParticipantLogin';
import OrganizerLogin from './pages/auth/OrganizerLogin';
import AdminLogin from './pages/auth/AdminLogin';

// Participant pages
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';

// Organizer pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerEvents from './pages/organizer/Events';
import MerchandiseApprovals from './pages/organizer/MerchandiseApprovals';
import AttendanceScanner from './pages/organizer/AttendanceScanner';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';
import ManageOrganizers from './pages/admin/ManageOrganizers';

// Route protection
import RoleRoute from './routes/RoleRoute';

import './App.css';

function AppRoutes() {
  const { isAuthenticated, actorType, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login/participant" element={<ParticipantLogin />} />
      <Route path="/login/organizer" element={<OrganizerLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />

      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedActorType="user" allowedRole="participant">
            <ParticipantDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/events"
        element={
          <RoleRoute allowedActorType="user" allowedRole="participant">
            <BrowseEvents />
          </RoleRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <RoleRoute allowedActorType="user" allowedRole="participant">
            <EventDetails />
          </RoleRoute>
        }
      />

      <Route
        path="/organizer/dashboard"
        element={
          <RoleRoute allowedActorType="organizer">
            <OrganizerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/organizer/events"
        element={
          <RoleRoute allowedActorType="organizer">
            <OrganizerEvents />
          </RoleRoute>
        }
      />
      <Route
        path="/organizer/merchandise-approvals"
        element={
          <RoleRoute allowedActorType="organizer">
            <MerchandiseApprovals />
          </RoleRoute>
        }
      />
      <Route
        path="/organizer/attendance/:eventId"
        element={
          <RoleRoute allowedActorType="organizer">
            <AttendanceScanner />
          </RoleRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <RoleRoute allowedActorType="user" allowedRole="admin">
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/password-resets"
        element={
          <RoleRoute allowedActorType="user" allowedRole="admin">
            <PasswordResetRequests />
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
