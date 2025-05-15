// src/components/AppHeader.jsx
'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { 
    FaSignOutAlt, FaUserCircle, FaChartBar, FaCog, 
    FaBars, FaTimes 
} from 'react-icons/fa';

// Import the links directly
import { kpiNavLinks } from '@/lib/kpiConstants.js'; 

export default function AppHeader() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => { /* ... click outside logic ... */ }, [isMenuOpen]);

  return (
    <header className="bg-background-secondary shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Burger Menu & Logo/App Title */}
          <div className="flex items-center">
            {user && (
              <button onClick={toggleMenu} className="p-2 mr-2 text-textClr-secondary hover:text-textClr-primary focus:outline-none md:hidden" aria-label="Open Navigation Menu" aria-expanded={isMenuOpen}>
                {isMenuOpen ? <FaTimes className="h-6 w-6"/> : <FaBars className="h-6 w-6"/>}
              </button>
            )}
            <Link href={user ? '/dashboard' : '/'} className="flex items-center text-accent-primary hover:text-accent-hover transition-colors">
              <FaChartBar className="h-7 w-7 mr-2" />
              <span className="font-bold text-xl sm:text-2xl text-textClr-primary">Metrics App</span>
            </Link>
          </div>

          

          {/* Right side: User Info and Logout */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FaUserCircle className="h-5 w-5 sm:h-6 text-textClr-secondary hidden sm:block" title={user.name}/>
              <span className="text-xs sm:text-sm text-textClr-secondary hidden md:block truncate max-w-[100px] sm:max-w-[150px]" title={user.name}>
                {user.name} <span className="hidden lg:inline">({user.role})</span>
              </span>
              <button onClick={logout} title="Log Out" className="p-1.5 text-textClr-secondary hover:text-red-400 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary focus:ring-accent-primary transition-colors">
                <FaSignOutAlt className="h-5 w-5" />
              </button>
              {/* Burger Menu Button visible on all sizes when logged in, if preferred for consistency, or add md:hidden to hide on desktop */}
              <button onClick={toggleMenu} className="p-2 text-textClr-secondary hover:text-textClr-primary focus:outline-none" aria-label="Open Navigation Menu" aria-expanded={isMenuOpen}>
                 {isMenuOpen ? <FaTimes className="h-6 w-6"/> : <FaBars className="h-6 w-6"/>}
              </button>
            </div>
          ) : (
             <Link href="/auth/login" className="btn-primary px-3 py-1.5 text-sm whitespace-nowrap">Log In</Link>
          )}
        </div>
      </div>

      {/* Mobile/Burger Menu Dropdown Panel */}
      {isMenuOpen && user && (
        <div ref={menuRef} className="absolute top-16 right-0 mt-1 w-64 sm:w-72 bg-background-secondary shadow-xl rounded-md border border-borderClr-primary z-40">
          <div className="px-2 py-2 space-y-1 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-textClr-primary hover:bg-accent-primary/20" onClick={() => setIsMenuOpen(false)}>
                Dashboard Summary
            </Link>
            {user.role === 'admin' && (<>
                    <hr className="border-borderClr-primary my-1"/>
                    <p className="px-3 pt-2 pb-1 text-xs text-textClr-secondary uppercase tracking-wider">Admin Tools</p>
                    <Link
                        href="/admin/data-generator"
                        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-textClr-primary hover:bg-accent-primary/20"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <FaCog className="mr-3 h-5 w-5 text-accent-primary/80" />
                        Data Generator
                    </Link>
                    {/* Add other admin links here (e.g., User Management) */}
                </>)}
            <hr className="border-borderClr-primary my-1"/>
            <p className="px-3 pt-2 pb-1 text-xs text-textClr-secondary uppercase tracking-wider">KPI Details</p>
            {kpiNavLinks.map((link) => ( // Use imported kpiNavLinks
              <Link key={link.name} href={link.path} className="flex items-center px-3 py-2 rounded-md text-base font-medium text-textClr-primary hover:bg-accent-primary/20" onClick={() => setIsMenuOpen(false)}>
                {link.icon && <link.icon className="mr-3 h-5 w-5 text-accent-primary/80" />}
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}