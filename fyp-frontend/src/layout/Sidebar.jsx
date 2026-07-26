import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Build nav links based on user role
  const navItems =
    user?.role === 'admin'
      ? [
          { label: 'Dashboard',        path: '/admin/dashboard', icon: '📊' },
          { label: 'User Management',  path: '/admin/users',     icon: '👥' },
          { label: 'Course Management',path: '/admin/courses',   icon: '📚' },
        ]
      : user?.role === 'teacher'
      ? [
          { label: 'Dashboard',  path: '/teacher/dashboard', icon: '📊' },
          { label: 'My Courses', path: '/teacher/courses',   icon: '📚' },
          { label: 'Submissions',path: '/teacher/grading',   icon: '📋' },
        ]
      : [
          { label: 'Dashboard',  path: '/student/dashboard',    icon: '📚' },
          { label: 'Assignments',path: '/student/assignments',  icon: '📋' },
          { label: 'Results',    path: '/student/results',      icon: '🏆' },
        ];

  // Check if a nav link is currently active
  const isActive = (path) => {
    if (path === '/teacher/dashboard') return location.pathname === '/teacher/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Dark overlay — mobile only, appears behind sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0
          flex flex-col
          bg-primary-blue text-white
          transition-all duration-300 ease-in-out
          z-50 md:z-auto
          ${isCollapsed ? 'w-16 md:w-20' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >

        {/* ── Top: logo / panel label ── */}
        <div className={`
          flex-shrink-0 px-4 py-4
          border-b border-white/15
          ${isCollapsed ? 'flex items-center justify-center' : ''}
        `}>
          {isCollapsed ? (
            // Show only emoji when collapsed
            <span className="text-2xl">🎓</span>
          ) : (
            <>
              <h2 className="text-xl font-bold leading-tight">Assess.io</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {user?.role === 'admin'
                  ? 'Admin Panel'
                  : user?.role === 'teacher'
                  ? 'Teacher Panel'
                  : 'Student Portal'}
              </p>
            </>
          )}
        </div>

        {/* ── Collapse toggle — desktop only ── */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            hidden md:flex items-center justify-center
            mx-2 mt-2 p-2 rounded-lg
            hover:bg-white/10 transition-colors duration-200
            text-white/70 hover:text-white
          "
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* ── Navigation links ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : ''}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  font-medium text-sm transition-colors duration-200
                  ${isCollapsed ? 'justify-center' : ''}
                  ${active
                    ? 'bg-white/25 border-l-4 border-white pl-2'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {/* Icon */}
                <span className="text-base flex-shrink-0 leading-none">
                  {item.icon}
                </span>

                {/* Label — hidden when collapsed */}
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom: user info + logout ── */}
        <div className="flex-shrink-0 px-2 pb-4 pt-2 border-t border-white/15">

          {/* User details — hidden when collapsed */}
          {!isCollapsed && (
            <div className="px-2 mb-3">
              <p className="text-xs text-blue-200">Logged in as</p>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                {user?.name}
              </p>
              <p className="text-xs text-blue-200 truncate">{user?.email}</p>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={logout}
            title="Logout"
            className="
              w-full flex items-center justify-center gap-2
              px-3 py-2 rounded-lg text-sm font-medium
              bg-white/15 hover:bg-white/25
              text-white transition-colors duration-200
            "
          >
            <span>🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* ── Close button — mobile only ── */}
        <button
          onClick={onClose}
          className="
            md:hidden absolute top-3 right-3
            p-1.5 rounded-lg
            hover:bg-white/10 transition-colors
          "
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>

      </aside>
    </>
  );
};