// src/app/dashboard/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.js';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary text-textClr-primary flex justify-center items-center">
        <p>Loading user data...</p> {/* Or a spinner component */}
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the useEffect redirect,
    // but it's a fallback or if redirect hasn't happened yet.
    return null; // Or a message "Redirecting to login..."
  }

  return (
    <div className="min-h-screen bg-background-primary text-textClr-primary p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-accent-primary">
          Performance Dashboard
        </h1>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-textClr-secondary">Welcome, {user.name}! ({user.role})</span>
            <button
              onClick={logout} // Use logout from AuthContext
              className="btn-primary bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm"
            >
              Log Out
            </button>
          </div>
        )}
      </div>
      
      <p className="text-textClr-secondary mb-6">
        Your personalized KPIs will be displayed here.
      </p>
      
      {/* Placeholder for KPI cards and charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example KPI Card (to be made into a component) */}
        <div className="bg-background-secondary p-6 rounded-card shadow">
          <h3 className="text-xl font-semibold text-accent-primary mb-2">KPI 1 Title</h3>
          <p className="text-4xl font-bold text-textClr-primary">75%</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
            <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        {/* Add more placeholder KPI cards */}
      </div>

    </div>
  );
}