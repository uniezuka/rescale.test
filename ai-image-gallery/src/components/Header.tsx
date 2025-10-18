import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              AI Image Gallery
            </h1>
          </div>
          
          <nav className="flex items-center space-x-4">
            {user ? (
              <UserMenu user={user} onSignOut={signOut} />
            ) : (
              <div className="flex items-center space-x-2">
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
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
