// src/components/AppHeader.jsx
'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Assuming path alias
import { FaSignOutAlt, FaUserCircle, FaThLarge, FaCog, FaChartBar } from 'react-icons/fa'; // Added FaCog

export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-background-secondary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center text-accent-primary hover:text-accent-hover transition-colors">
              <FaChartBar className="h-7 w-7 mr-2" /> {/* Changed icon */}
              <span className="font-bold text-xl sm:text-2xl text-textClr-primary">
                Metrics App
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            {user && ( // Links for any authenticated user
              <Link href="/dashboard" className="text-textClr-secondary hover:text-textClr-primary px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
            )}
            {/* Future: Burger menu trigger for KPI detail pages can go here */}
            
            {user && user.role === 'admin' && ( // Links only for admins
              <>
                <span className="text-gray-500">|</span> {/* Separator */}
                <Link href="/admin/data-generator" className="text-textClr-secondary hover:text-textClr-primary px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <FaCog className="mr-1.5 h-4 w-4" /> Data Gen
                </Link>
                {/* Future: <Link href="/admin/users" className="...">User Management</Link> */}
              </>
            )}
          </nav>

          {user ? (
            <div className="flex items-center space-x-3">
              <FaUserCircle className="h-6 w-6 text-textClr-secondary hidden sm:block" title={user.name}/>
              <span className="text-xs sm:text-sm text-textClr-secondary hidden md:block">
                {user.name} ({user.role})
              </span>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-textClr-secondary hover:text-red-400 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary focus:ring-accent-primary transition-colors"
              >
                <FaSignOutAlt className="h-5 w-5 sm:h-6" />
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="btn-primary px-3 py-1.5 text-sm">
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}