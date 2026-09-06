import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initAnalytics, track } from './lib/analytics';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/common/ThemeProvider';
import { Toaster } from './components/ui/toaster';
import { cn } from './lib/utils';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import PageSkeleton from './components/common/PageSkeleton';
import { RequireAuth, RequireAdmin } from './components/auth/AuthGuard';

// Route-level code splitting: each page (and its dependencies) loads on demand.
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Profile = lazy(() => import('./pages/Profile'));
const Billing = lazy(() => import('./pages/Billing'));
const Library = lazy(() => import('./pages/Library'));
const Community = lazy(() => import('./pages/Community'));
const Support = lazy(() => import('./pages/Support'));
const Legal = lazy(() => import('./pages/Legal'));
const Settings = lazy(() => import('./pages/Settings'));
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'));
const LecturerProfile = lazy(() => import('./pages/LecturerProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminQuestions = lazy(() => import('./pages/admin/Questions'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // Usage analytics: session lifecycle + page-view tracking
  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    track('page_view', { page: location.pathname });
  }, [location.pathname]);

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <div className={cn('font-body antialiased min-h-screen bg-background flex flex-col items-center')}>
          {!isAdminRoute && <Header />}
          <main className={cn('flex-1 w-full', isAdminRoute ? '' : 'container mx-auto px-4 pt-24 pb-28')}>
            <Suspense fallback={<PageSkeleton />}>
              <div
                key={location.pathname}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
                <Route path="/library" element={<Library />} />
                <Route path="/community" element={<RequireAuth><Community /></RequireAuth>} />
                <Route path="/support" element={<Support />} />
                <Route path="/privacy" element={<Legal />} />
                <Route path="/terms" element={<Legal />} />
                <Route path="/refunds" element={<Legal />} />
                <Route path="/cookies" element={<Legal />} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/questions/:id" element={<RequireAuth><QuestionDetail /></RequireAuth>} />
                <Route path="/lecturer/:id" element={<RequireAuth><LecturerProfile /></RequireAuth>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="questions" element={<AdminQuestions />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
            </Suspense>
          </main>
          {!isAdminRoute && <Footer />}
          <Toaster />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
