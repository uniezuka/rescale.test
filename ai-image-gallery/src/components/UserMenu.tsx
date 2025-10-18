import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';

interface UserMenuProps {
  user: User;
  onSignOut: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="text-gray-700">{user.email}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
            {user.email}
          </div>
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
