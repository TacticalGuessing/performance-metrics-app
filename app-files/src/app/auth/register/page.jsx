// src/app/auth/register/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // If you want to redirect after registration

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role for new users

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!employeeId.trim()) { // Basic validation for employeeId
        setError('Employee ID is required.');
        setIsLoading(false);
        return;
    }

    // Add more client-side validation if desired (e.g., password strength)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, employeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccessMessage(data.message + ' You can now log in.');
      // Optionally reset form or redirect
      setName('');
      setEmail('');
      setEmployeeId('');
      setPassword('');
      setConfirmPassword('');
      // router.push('/auth/login'); // Example redirect

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
          Create Account
        </h1>
        {error && <p className="mb-4 text-sm text-red-400 bg-red-500/20 p-3 rounded-minimal text-center">{error}</p>}
        {successMessage && <p className="mb-4 text-sm text-emerald-300 bg-emerald-500/20 p-3 rounded-minimal text-center">{successMessage}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-textClr-secondary mb-1">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-textClr-secondary mb-1">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="your.name@example.gov"/>
            <p className="mt-1 text-xs text-textClr-secondary">Use your official email address.</p>
          </div>
          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium text-textClr-secondary mb-1">Employee ID</label>
            <input type="text" id="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value.toUpperCase())} required className="input-field" placeholder="e.g., P0001"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-textClr-secondary mb-1">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
            <p className="mt-1 text-xs text-textClr-secondary">Min. 8 characters. Mix of letters, numbers, symbols recommended.</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-textClr-secondary mb-1">Confirm Password</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field" />
          </div>
          {/* Optional: Role selection for admin creation, otherwise default to 'user' */}
          {/* <div>
            <label htmlFor="role" className="block text-sm font-medium text-textClr-secondary mb-1">Role (Dev only)</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="team_leader">Team Leader</option>
              <option value="director">Director</option>
            </select>
          </div> */}

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5">
            {isLoading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-textClr-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-accent-primary hover:text-accent-hover">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}