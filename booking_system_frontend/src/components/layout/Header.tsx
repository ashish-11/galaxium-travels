import { useLocation, useNavigate } from 'react-router-dom';
import {
  Header as CarbonHeader,
  HeaderContainer,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
} from '@carbon/react';
import { Rocket, User, Logout } from '@carbon/icons-react';
import { useUser } from '../../hooks/useUser';
import { motion } from 'framer-motion';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const isActive = (path: string) => location.pathname === path;

  return (
    <HeaderContainer
      render={() => (
        <CarbonHeader aria-label="Galaxium Travels" className="carbon-header-custom">
          <SkipToContent />
          
          {/* Logo */}
          <HeaderName href="/" prefix="" className="header-name-custom">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ duration: 0.3 }}
              >
                <Rocket size={24} className="text-cosmic-purple" />
              </motion.div>
              <span className="text-xl font-bold bg-cosmic-gradient bg-clip-text text-transparent">
                Galaxium Travels
              </span>
            </div>
          </HeaderName>

          {/* Navigation */}
          <HeaderNavigation aria-label="Main Navigation">
            <HeaderMenuItem
              href="/"
              isActive={isActive('/')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              Home
            </HeaderMenuItem>
            <HeaderMenuItem
              href="/flights"
              isActive={isActive('/flights')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                navigate('/flights');
              }}
            >
              Flights
            </HeaderMenuItem>
            {user && (
              <HeaderMenuItem
                href="/bookings"
                isActive={isActive('/bookings')}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  navigate('/bookings');
                }}
              >
                My Bookings
              </HeaderMenuItem>
            )}
          </HeaderNavigation>

          {/* User Actions */}
          <HeaderGlobalBar>
            {user ? (
              <>
                <HeaderGlobalAction
                  aria-label={`User: ${user.name}`}
                  tooltipAlignment="end"
                  className="user-action-custom"
                >
                  <User size={20} />
                  <span className="hidden md:inline ml-2 text-sm">{user.name}</span>
                </HeaderGlobalAction>
                <HeaderGlobalAction
                  aria-label="Logout"
                  onClick={logout}
                  tooltipAlignment="end"
                >
                  <Logout size={20} />
                </HeaderGlobalAction>
              </>
            ) : (
              <HeaderGlobalAction
                aria-label="Book a Flight"
                onClick={() => navigate('/flights')}
                tooltipAlignment="end"
              >
                <Rocket size={20} />
              </HeaderGlobalAction>
            )}
          </HeaderGlobalBar>
        </CarbonHeader>
      )}
    />
  );
};

// Made with Bob
