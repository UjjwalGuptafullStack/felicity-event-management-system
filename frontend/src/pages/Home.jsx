import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Users, Calendar, Shield } from 'lucide-react';
import { GradientButton } from '../components/design-system/GradientButton';

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">Felicity</span>
            {' '}Event Management
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Your ultimate college fest platform - vibrant, modern, and tech-savvy
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12"
        >
          <Link to="/login/participant" className="group">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl transition-all border border-white/20 hover:shadow-primary/20"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3 text-center">Participant</h2>
              <p className="text-muted-foreground text-center">Register for events and manage tickets</p>
              <div className="mt-6 h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-primary to-primary-light rounded-full mx-auto"></div>
            </motion.div>
          </Link>

          <Link to="/login/organizer" className="group">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl transition-all border border-white/20 hover:shadow-secondary/20"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <Calendar className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-secondary mb-3 text-center">Organizer</h2>
              <p className="text-muted-foreground text-center">Create and manage amazing events</p>
              <div className="mt-6 h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-secondary to-secondary-light rounded-full mx-auto"></div>
            </motion.div>
          </Link>

          <Link to="/login/admin" className="group">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl transition-all border border-white/20 hover:shadow-accent/20"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-accent/10 rounded-full">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-accent mb-3 text-center">Admin</h2>
              <p className="text-muted-foreground text-center">Oversee platform and users</p>
              <div className="mt-6 h-1 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-accent to-accent-light rounded-full mx-auto"></div>
            </motion.div>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-white/90 mb-4 text-lg">New to Felicity?</p>
          <Link to="/register">
            <GradientButton variant="accent" size="lg">
              Join the Fest →
            </GradientButton>
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default Home;
