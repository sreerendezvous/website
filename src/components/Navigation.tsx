import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Star, MessageSquare, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { AuthModal } from './auth/AuthModal';
import { useMessageStore } from '@/lib/store/messageStore';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'sign-in' | 'sign-up'>('sign-in');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { unreadCount } = useMessageStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuth = (type: 'sign-in' | 'sign-up') => {
    setAuthModalTab(type);
    setShowAuthModal(true);
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-earth-900/95 backdrop-blur-sm border-b border-earth-800' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="font-display text-2xl tracking-wider text-sand-100">
              rendezvous
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink href="/experiences">Experiences</NavLink>
              <NavLink href="/creators">Creators</NavLink>
              <NavLink href="/about">About</NavLink>
              {user ? (
                <div className="flex items-center space-x-4">
                  {user.role === 'admin' && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  {user.role === 'creator' && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/creator/dashboard')}>
                      <Star className="h-4 w-4 mr-2" />
                      Creator Dashboard
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-sand-400/10 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleProfile}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" onClick={() => handleAuth('sign-in')}>
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => handleAuth('sign-up')}>
                    Join Now
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-sand-100"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden bg-earth-900/95 backdrop-blur-sm border-b border-earth-800"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="container mx-auto px-4 py-8 space-y-6">
                <MobileNavLink href="/experiences" onClick={() => setIsOpen(false)}>
                  Experiences
                </MobileNavLink>
                <MobileNavLink href="/creators" onClick={() => setIsOpen(false)}>
                  Creators
                </MobileNavLink>
                <MobileNavLink href="/about" onClick={() => setIsOpen(false)}>
                  About
                </MobileNavLink>
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          navigate('/admin');
                          setIsOpen(false);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    )}
                    {user.role === 'creator' && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          navigate('/creator/dashboard');
                          setIsOpen(false);
                        }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Creator Dashboard
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        navigate('/messages');
                        setIsOpen(false);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                      {unreadCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-sand-400/10 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleProfile}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setIsOpen(false);
                        handleAuth('sign-in');
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setIsOpen(false);
                        handleAuth('sign-up');
                      }}
                    >
                      Join Now
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      to={href}
      className="text-sm uppercase tracking-wider text-sand-100 hover:text-sand-300 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link 
      to={href}
      className="block text-lg font-display text-sand-100 hover:text-sand-300 transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}