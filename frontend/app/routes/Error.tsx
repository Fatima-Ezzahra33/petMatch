import React from 'react';
import { Link, useRouteError, isRouteErrorResponse } from 'react-router';
import { Home, ArrowLeft, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '~/contexts/themeContext';

// This loader throws a 404 response for any unmatched routes
export function loader() {
  throw new Response("Not Found", { 
    status: 404, 
    statusText: "Not Found" 
  });
}

// This won't render because the loader always throws
export default function CatchAll() {
  return null;
}

// This renders your Error page when the 404 is thrown
export function ErrorBoundary() {
  const { isDarkMode, toggleTheme } = useTheme();
  const error = useRouteError();
  let errorMessage = "Something went wrong.";
  let errorTitle = "Oops!";
  let errorCode = "500";

  if (isRouteErrorResponse(error)) {
      errorCode = error.status.toString();
      if (error.status === 404) {
          errorMessage = "This page seems to have wandered off. Let's get you back home.";
          errorTitle = "Page Not Found";
      } else {
          errorMessage = error.statusText || errorMessage;
      }
  } else if (error instanceof Error) {
      errorMessage = (error as Error).message;
  }

  return (
      <div 
          className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative"
          style={{ backgroundColor: isDarkMode ? '#36332E' : '#F7F5EA' }}
      >
          {/* Theme Toggle Button */}
          <button
              onClick={toggleTheme}
              className="fixed top-6 right-6 z-50 p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                  backgroundColor: isDarkMode ? '#4A4642' : '#FFFFFF',
                  boxShadow: isDarkMode 
                      ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                      : '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              aria-label="Toggle theme"
          >
              {isDarkMode ? (
                  <Sun className="w-5 h-5" style={{ color: '#F5F3ED' }} />
              ) : (
                  <Moon className="w-5 h-5" style={{ color: '#36332E' }} />
              )}
          </button>

          <div className="max-w-4xl w-full text-center">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8 sm:space-y-12"
              >
                  {/* Error Content */}
                  <motion.div 
                      className="space-y-4 sm:space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                  >
                      <h1 
                          className="text-7xl sm:text-8xl md:text-9xl font-bold font-playfair tracking-tight"
                          style={{ color: '#D97F3E' }}
                      >
                          {errorCode}
                      </h1>
                      
                      <h2 
                          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-playfair font-semibold transition-colors duration-300"
                          style={{ color: isDarkMode ? '#F5F3ED' : '#36332E' }}
                      >
                          {errorTitle}
                      </h2>
                      
                      <p 
                          className="text-base sm:text-lg md:text-xl lg:text-2xl font-raleway max-w-2xl mx-auto leading-relaxed px-4 transition-colors duration-300"
                          style={{ color: isDarkMode ? '#E8DCC8' : '#5A554F' }}
                      >
                          {errorMessage}
                      </p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div 
                      className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-8 px-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                  >
                      <button 
                          onClick={() => window.history.back()}
                          className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 rounded-xl 
                              font-raleway font-medium text-base sm:text-lg
                              transform hover:scale-105 active:scale-95
                              transition-all duration-200 
                              flex items-center justify-center gap-2"
                          style={{
                              backgroundColor: isDarkMode ? '#4A4642' : '#FFFFFF',
                              color: isDarkMode ? '#F5F3ED' : '#36332E',
                              border: `2px solid ${isDarkMode ? '#6B6558' : '#D97F3E'}`,
                              boxShadow: isDarkMode 
                                  ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                                  : '0 4px 6px rgba(217, 127, 62, 0.2)'
                          }}
                      >
                          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          Go Back
                      </button>
                      
                      <Link 
                          to="/"
                          className="w-full sm:w-auto"
                      >
                          <button
                              className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 rounded-xl 
                                  font-raleway font-medium text-base sm:text-lg
                                  transform hover:scale-105 active:scale-95
                                  transition-all duration-200 
                                  flex items-center justify-center gap-2"
                              style={{
                                  backgroundColor: '#D97F3E',
                                  color: '#F7F5EA',
                                  boxShadow: '0 10px 15px -3px rgba(217, 127, 62, 0.4)'
                              }}
                          >
                              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                              Take Me Home
                          </button>
                      </Link>
                  </motion.div>

                  {/* Footer Link */}
                  <motion.div 
                      className="pt-8 sm:pt-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                  >
                      <p 
                          className="text-sm sm:text-base font-raleway transition-colors duration-300"
                          style={{ color: isDarkMode ? '#8B8579' : '#877E6F' }}
                      >
                          Need help?{' '}
                          <Link 
                              to="/contact" 
                              className="font-medium hover:underline transition-colors duration-200"
                              style={{ color: '#D97F3E' }}
                          >
                              Contact support
                          </Link>
                      </p>
                  </motion.div>
              </motion.div>
          </div>
      </div>
  );
}