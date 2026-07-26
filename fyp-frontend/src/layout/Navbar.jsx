import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 *
 * Top navigation bar with:
 * - Mobile menu toggle
 * - Dynamic page title based on current route
 * - Quick user info
 *
 * Fix applied:
 * - Page title is now derived from the current route (useLocation)
 *   instead of being hardcoded based only on role
 */
export const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Map routes to readable page titles
  const getPageTitle = (pathname) => {
    const titles = {
      // Student
      '/student/dashboard':   'Dashboard',
      '/student/assignments': 'My Assignments',
      '/student/results':     'My Results',
      '/student/upload':      'Submit Assignment',

      // Teacher
      '/teacher/dashboard':   'Dashboard',
      '/teacher/grading':     'Grading Queue',

      // Admin
      '/admin/dashboard':         'Dashboard',
      '/admin/users':             'User Management',
      '/admin/courses':           'Course Management',
      '/admin/create-assignment': 'Create Assignment',
      '/admin/grading-queue':     'Grading Queue',
    };

    // Exact match first
    if (titles[pathname]) return titles[pathname];

    // Partial match for dynamic routes like /student/results/submission/:id
    if (pathname.startsWith('/student/results/submission/')) return 'Result Details';
    if (pathname.startsWith('/student/upload/'))             return 'Submit Assignment';
    if (pathname.startsWith('/student/course/'))             return 'Course View';
    if (pathname.startsWith('/teacher/course/'))             return 'Course Editor';

    // Fallback
    return '';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="bg-primary-blue text-white shadow-lg">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left: Mobile menu button + Dynamic Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">{pageTitle}</h1>
        </div>

        {/* Right: User info */}
        <div className="text-right">
          <p className="text-sm sm:text-base font-medium">{user?.name}</p>
          <p className="text-xs sm:text-sm text-blue-100 capitalize">
            {user?.role}
          </p>
        </div>
      </div>
    </header>
  );
};