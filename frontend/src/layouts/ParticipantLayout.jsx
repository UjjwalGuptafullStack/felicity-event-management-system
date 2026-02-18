import { Outlet } from 'react-router-dom';
import { ParticipantNav } from '../components/ParticipantNav';

export const ParticipantLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <ParticipantNav />
      <Outlet />
    </div>
  );
};
