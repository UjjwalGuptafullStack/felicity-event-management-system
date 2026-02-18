import { Outlet } from 'react-router-dom';
import { OrganizerNav } from '../components/OrganizerNav';

export const OrganizerLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <OrganizerNav />
      <Outlet />
    </div>
  );
};
