import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlaygroundPage } from '@/pages/PlaygroundPage';
import { LearnPage } from '@/pages/LearnPage';
import { LearnUnitPage } from '@/pages/LearnUnitPage';
import { LearnLessonPage } from '@/pages/LearnLessonPage';
import { ChallengesPage } from '@/pages/ChallengesPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { AboutPage } from '@/pages/AboutPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { ProfilePage } from '@/pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Auth pages (outside the app shell, no sidebar) ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* ── App shell ── */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="learn/:unitId" element={<LearnUnitPage />} />
            <Route path="learn/:unitId/:lessonId" element={<LearnLessonPage />} />
            <Route path="challenges" element={<ChallengesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
