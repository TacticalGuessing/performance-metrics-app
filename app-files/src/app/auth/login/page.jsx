// src/app/auth/login/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.js'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { fetchUser } = useAuth(); // Get fetchUser from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      
      await fetchUser(); // Fetch user data to update context
      router.push('/dashboard'); 

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-background-secondary p-8 rounded-card shadow-lg">
        <h1 className="text-3xl font-bold text-accent-primary mb-6 text-center">
          Log In
        </h1>
        {error && <p className="mb-4 text-sm text-red-400 bg-red-500/20 p-3 rounded-minimal text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-textClr-secondary mb-1">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-textClr-secondary mb-1">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
          </div>
          
          <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5">
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-textClr-secondary">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-medium text-accent-primary hover:text-accent-hover">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}