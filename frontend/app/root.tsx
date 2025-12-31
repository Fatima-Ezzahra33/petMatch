import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from 'app/contexts/themeContext';
import { AuthProvider } from "app/contexts/auth";
import { UserProvider } from './contexts/UserContext';
import Error from './routes/Error';


import type { Route } from "./+types/root";
import "./app.css";
import NavBar from "./components/NavBar";

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.css",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/iconPaw.png" type="image/x-icon"></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const location = useLocation();
  
  // Routes that should show NavBar (public pages)
  const publicRoutes = ['/', '/our-pets', '/contact', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  // Check if it's the welcome/user page
  const isWelcomeUserPage = location.pathname === '/welcome-user'; // adjust to your actual route
  
  // Build className conditionally
  const containerClassName = isWelcomeUserPage 
    ? 'flex flex-col' 
    : 'min-h-screen bg-BgLight flex flex-col pt-16';
  
  const contentClassName = isWelcomeUserPage 
    ? '' 
    : `${isPublicRoute ? 'mt-15 pt-5' : ''} flex-grow container mx-auto px-4`;
  
  return (
    <div className={containerClassName}>
      {isPublicRoute && <NavBar/>}
      <div className={contentClassName}>
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const Client = new QueryClient();
  return (
    <QueryClientProvider client={Client}>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <AppContent />
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Error />
        <Scripts />
      </body>
    </html>
  );
}
