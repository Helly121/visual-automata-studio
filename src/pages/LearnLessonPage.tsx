import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Clock, BookOpen, Info } from 'lucide-react';
import { getUnit, getLesson } from '@/data/units';
import { Button, Badge } from '@/components/ui';
import { formatDuration } from '@/utils';
import { FA01AlphabetsLesson } from '@/features/lessons/FA01AlphabetsLesson';
import { FA02DFALesson } from '@/features/lessons/FA02DFALesson';
import { FA03DFADesignLesson } from '@/features/lessons/FA03DFADesignLesson';
import { FA04NFALesson } from '@/features/lessons/FA04NFALesson';
import { FA05SubsetConstructionLesson } from '@/features/lessons/FA05SubsetConstructionLesson';
import { FA06MinimisationLesson } from '@/features/lessons/FA06MinimisationLesson';
import { FA07PumpingLemmaLesson } from '@/features/lessons/FA07PumpingLemmaLesson';
import { FA08ClosurePropertiesLesson } from '@/features/lessons/FA08ClosurePropertiesLesson';
import { LessonCompletionBanner, useLearningProgress, KnowledgeCheck } from '@/features/learning';
import type { KnowledgeCheckQuestion } from '@/features/learning';

export function LearnLessonPage() {
  const { unitId, lessonId } = useParams<{ unitId: string; lessonId: string }>();
  const navigate = useNavigate();
  const unit = getUnit(unitId ?? '');
  const lesson = getLesson(unitId ?? '', lessonId ?? '');
  const { isLessonCompleted } = useLearningProgress();

  if (!unit || !lesson) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 dark:text-gray-500 mb-4">Lesson not found.</p>
        <Button variant="outline" onClick={() => navigate(`/learn/${unitId}`)}>Back to Unit</Button>
      </div>
    );
  }

  const isCompleted = isLessonCompleted(lesson.id);

  // Find prev/next lesson
  const sorted = [...unit.lessons].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextLesson = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  // Render content based on lesson id
  const LessonContent = lessonContentMap[lesson.id];

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-5 flex-wrap" aria-label="Breadcrumb">
        <NavLink to="/learn" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Learn</NavLink>
        <ChevronRight className="w-3 h-3" />
        <NavLink to={`/learn/${unit.id}`} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {unit.shortTitle}
        </NavLink>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-300">{lesson.title}</span>
      </nav>

      {/* Lesson header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="blue">Unit {unit.number}</Badge>
          {isCompleted ? (
            <Badge variant="green" dot>
              Completed
            </Badge>
          ) : (
            <Badge variant="gray">
              In Progress
            </Badge>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatDuration(lesson.duration)}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          {lesson.order}. {lesson.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {lesson.topics.map((t) => (
            <Badge key={t} variant="gray" className="text-[10px]">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="prose-lesson">
        {LessonContent ? (
          <LessonContent />
        ) : (
          <GenericLessonContent lesson={lesson} unit={unit} />
        )}
      </div>

      {/* Lesson Completion and Rewards Banner */}
      <LessonCompletionBanner
        lessonId={lesson.id}
        unitId={unit.id}
        nextLesson={nextLesson}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
        {prevLesson ? (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate(`/learn/${unit.id}/${prevLesson.id}`)}
          >
            {prevLesson.title}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/learn/${unit.id}`)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Unit Overview
          </Button>
        )}

        {nextLesson && nextLesson.status !== 'locked' ? (
          <Button
            size="sm"
            rightIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => navigate(`/learn/${unit.id}/${nextLesson.id}`)}
          >
            Next: {nextLesson.title}
          </Button>
        ) : nextLesson ? (
          <Button size="sm" variant="outline" disabled rightIcon={<ChevronRight className="w-4 h-4" />}>
            {nextLesson.title} (Locked)
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => navigate(`/learn/${unit.id}`)}>
            Finish Unit
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Fallback for lessons without dedicated content ─────────────────────────
function GenericLessonContent({ lesson, unit }: { lesson: ReturnType<typeof getLesson>; unit: ReturnType<typeof getUnit> }) {
  if (!lesson || !unit) return null;

  const genericQuestion: KnowledgeCheckQuestion = {
    id: `kc-${lesson.id}-check`,
    type: 'true-false',
    prompt: `Fundamental Concept Check: Does mastery of "${lesson.title}" require understanding state transitions and formal language semantics?`,
    options: [
      {
        id: 'opt-t',
        text: 'True',
        isCorrect: true,
        explanation: 'Yes, all modules in formal language theory rigorously model computation via state transitions and language semantics.',
      },
      {
        id: 'opt-f',
        text: 'False',
        isCorrect: false,
        explanation: 'Every topic in this curriculum relies on formal state transitions and computational semantics.',
      },
    ],
    explanation: 'Core theoretical concepts in automata require rigorous formal semantics.',
    hints: ['Consider how automata and languages are represented mathematically in this course.'],
    points: 10,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Curriculum Topic: {lesson.title}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            Aligned with <strong>{unit.title}</strong> in the VIT Pune syllabus. Review the core topics below,
            attempt the interactive check, and mark the lesson complete to log your progress.
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Topics covered in this lesson</h3>
        </div>
        <ul className="space-y-1.5 mb-5">
          {lesson.topics.map((t) => (
            <li key={t} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600 mt-2 flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>

        <KnowledgeCheck question={genericQuestion} />
      </div>
    </div>
  );
}

// ─── Lesson content registry ─────────────────────────────────────────────────
const lessonContentMap: Record<string, React.ComponentType | undefined> = {
  'fa-01-alphabets': FA01AlphabetsLesson,
  'fa-02-dfa': FA02DFALesson,
  'fa-03-dfa-examples': FA03DFADesignLesson,
  'fa-04-nfa': FA04NFALesson,
  'fa-05-subset': FA05SubsetConstructionLesson,
  'fa-06-minimisation': FA06MinimisationLesson,
  'fa-07-pumping': FA07PumpingLemmaLesson,
  'fa-08-closure': FA08ClosurePropertiesLesson,
};
