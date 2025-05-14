// src/app/layout.jsx
import { Inter } from 'next/font/google'; // Or your chosen font
import './globals.css';
import { AuthProvider } from '../context/AuthContext'; // Import AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Performance Metrics App',
  description: 'Visualize your performance metrics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}