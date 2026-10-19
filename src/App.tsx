import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/:unitId" element={<LearnUnitPage />} />
          <Route path="learn/:unitId/:lessonId" element={<LearnLessonPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
