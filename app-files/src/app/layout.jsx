// src/app/layout.jsx
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext'; // Adjust path if needed
import AppHeader from '../components/AppHeader';     // Adjust path if needed

const inter = Inter({ subsets: ['latin'] });

export const metadata = { /* ... */ };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background-primary`}> {/* Moved bg here */}
        <AuthProvider>
          <AppHeader /> {/* Add AppHeader here */}
          <main className="pt-4 pb-8"> {/* Add some padding to main content below header */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}