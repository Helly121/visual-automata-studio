import { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, Play, Sparkles } from 'lucide-react';
import type { VerificationResult } from '@/engine/transform/types';
import type { FiniteAutomaton } from '@/engine/types';
import { simulate } from '@/engine/simulate';
import { Button } from '@/components/ui';
import { cn } from '@/utils';

interface EquivalenceTesterProps {
  sourceMachine: FiniteAutomaton;
  targetMachine: FiniteAutomaton;
  verification: VerificationResult;
  className?: string;
}

export function EquivalenceTester({
  sourceMachine,
  targetMachine,
  verification,
  className,
}: EquivalenceTesterProps) {
  const [showAllSamples, setShowAllSamples] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customTestResult, setCustomTestResult] = useState<{
    input: string;
    sourceAccepted: boolean;
    targetAccepted: boolean;
    matches: boolean;
  } | null>(null);

  const handleTestCustomString = (e: React.FormEvent) => {
    e.preventDefault();
    const sRes = simulate(sourceMachine, customInput);
    const tRes = simulate(targetMachine, customInput);

    setCustomTestResult({
      input: customInput,
      sourceAccepted: sRes.accepted,
      targetAccepted: tRes.accepted,
      matches: sRes.accepted === tRes.accepted,
    });
  };

  const displayedSamples = showAllSamples
    ? verification.samples
    : verification.samples.slice(0, 8);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card p-4 flex flex-col gap-3',
        className,
      )}
    >
      {/* Header and Equivalence Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={cn(
              'w-5 h-5',
              verification.allMatch ? 'text-emerald-500' : 'text-rose-500',
            )}
          />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Language Equivalence Verification
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              L(M_source) ≟ L(M_target)
            </p>
          </div>
        </div>

        <span
          className={cn(
            'px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border',
            verification.allMatch
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
          )}
        >
          {verification.allMatch ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Language Preserved (100% Match)
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" /> Discrepancy Found
            </>
          )}
        </span>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50/70 dark:bg-gray-800/30 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
        {verification.summaryMessage}
      </p>

      {/* Interactive Custom String Tester */}
      <form
        onSubmit={handleTestCustomString}
        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl border border-gray-100 dark:border-gray-800"
      >
        <div className="flex-1 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary-500 ml-1 shrink-0" />
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type a custom string (e.g. 0101, aa) to verify..."
            className="w-full text-xs font-mono bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <Button size="sm" type="submit" rightIcon={<Play className="w-3 h-3" />}>
          Verify
        </Button>
      </form>

      {/* Custom Result Callout */}
      {customTestResult && (
        <div
          className={cn(
            'p-2.5 rounded-xl text-xs font-mono flex items-center justify-between border',
            customTestResult.matches
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
          )}
        >
          <span>
            Input "{customTestResult.input}": Source ={' '}
            {customTestResult.sourceAccepted ? 'ACCEPT ✓' : 'REJECT ✗'} · Transformed ={' '}
            {customTestResult.targetAccepted ? 'ACCEPT ✓' : 'REJECT ✗'}
          </span>
          <span className="font-bold font-sans">
            {customTestResult.matches ? 'MATCH ✓' : 'MISMATCH ✗'}
          </span>
        </div>
      )}

      {/* Representative Sample Strings Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <th className="py-1 px-2">Sample String</th>
              <th className="py-1 px-2 text-center">Original Machine</th>
              <th className="py-1 px-2 text-center">Transformed Machine</th>
              <th className="py-1 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {displayedSamples.map((sample, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                <td className="py-1.5 px-2 font-semibold text-gray-800 dark:text-gray-200">
                  {sample.displayInput}
                </td>
                <td className="py-1.5 px-2 text-center">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                      sample.sourceAccepted
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                    )}
                  >
                    {sample.sourceAccepted ? 'ACCEPT' : 'REJECT'}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-center">
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                      sample.targetAccepted
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
                    )}
                  >
                    {sample.targetAccepted ? 'ACCEPT' : 'REJECT'}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-center">
                  {sample.matches ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center justify-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Match
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] flex items-center justify-center gap-0.5">
                      <XCircle className="w-3 h-3" /> Diff
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {verification.samples.length > 8 && (
        <button
          onClick={() => setShowAllSamples((prev) => !prev)}
          className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline self-center"
        >
          {showAllSamples
            ? 'Show Fewer Samples'
            : `View All ${verification.samples.length} Test Samples`}
        </button>
      )}
    </div>
  );
}
