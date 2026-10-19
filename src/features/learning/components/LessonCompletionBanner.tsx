import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Star, ChevronRight, Award } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLearningProgress } from '../progressStore';
import { cn } from '@/utils';
import type { Lesson } from '@/types';

interface LessonCompletionBannerProps {
  lessonId: string;
  unitId: string;
  nextLesson: Lesson | null;
  className?: string;
}

export function LessonCompletionBanner({
  lessonId,
  unitId,
  nextLesson,
  className,
}: LessonCompletionBannerProps) {
  const navigate = useNavigate();
  const { isLessonCompleted, completeLesson, state } = useLearningProgress();
  const [justCompletedNotice, setJustCompletedNotice] = useState<{ isNew: boolean; xp: number } | null>(null);

  const completed = isLessonCompleted(lessonId);
  const rewardKey = `lesson:${lessonId}`;
  const alreadyClaimedXP = state.rewardedIds.includes(rewardKey);

  const handleMarkComplete = () => {
    const res = completeLesson(lessonId, unitId, 100);
    setJustCompletedNotice({ isNew: res.isNewReward, xp: res.xpAwarded });
  };

  return (
    <div
      className={cn(
        'mt-10 rounded-2xl p-5 border transition-all duration-200 shadow-card',
        completed
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200 dark:border-emerald-800'
          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              completed
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
            )}
          >
            {completed ? <CheckCircle2 className="w-5 h-5" /> : <Award className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {completed ? 'Lesson Completed!' : 'Ready to wrap up?'}
              </h3>
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                <Star className="w-3 h-3 fill-purple-600 dark:fill-purple-400" />
                {completed && !alreadyClaimedXP ? '+50 XP' : completed ? '50 XP Claimed' : '+50 XP on completion'}
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              {completed
                ? 'Your progress has been recorded. Syllabus and dashboard stats are synchronized.'
                : 'Complete the interactive checks and mark this lesson finished to advance your course progress.'}
            </p>

            {justCompletedNotice && (
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1.5 animate-fade-in">
                {justCompletedNotice.isNew
                  ? `🎉 Congratulations! You earned +${justCompletedNotice.xp} XP!`
                  : '✨ Lesson updated! (XP previously claimed; duplicate reward prevented)'}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {!completed ? (
            <Button
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleMarkComplete}
            >
              Mark as Complete
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              onClick={handleMarkComplete}
            >
              Re-sync Status
            </Button>
          )}

          {nextLesson && (
            <Button
              size="sm"
              variant={completed ? 'primary' : 'outline'}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => navigate(`/learn/${unitId}/${nextLesson.id}`)}
            >
              Next Lesson
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
