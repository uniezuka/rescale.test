import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <motion.header 
      className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              AI Image Gallery
            </h1>
          </motion.div>
          
          <nav className="flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ThemeToggle />
            </motion.div>
            
            {user ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <UserMenu user={user} onSignOut={signOut} />
              </motion.div>
            ) : (
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // This will be handled by routing
                    window.location.href = '/login';
                  }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // This will be handled by routing
                    window.location.href = '/signup';
                  }}
                >
                  Sign Up
                </Button>
              </motion.div>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
};
