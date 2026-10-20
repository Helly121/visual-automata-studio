import { useState } from 'react';
import { Copy, Check, Code2, BookOpen } from 'lucide-react';
import type { FiniteAutomaton } from '@/engine/types';
import { Modal, Button } from '@/components/ui';

interface FormalDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: FiniteAutomaton;
  title: string;
}

export function FormalDefinitionModal({
  isOpen,
  onClose,
  machine,
  title,
}: FormalDefinitionModalProps) {
  const [tab, setTab] = useState<'math' | 'json'>('math');
  const [copied, setCopied] = useState(false);

  const stateNames = machine.states.map((s) => s.label).join(', ');
  const alphabetStr = machine.alphabet.join(', ');
  const startStateLabel =
    machine.states.find((s) => s.id === machine.initialStateId)?.label ?? 'None';
  const acceptingLabels =
    machine.states
      .filter((s) => machine.acceptingStateIds.includes(s.id))
      .map((s) => s.label)
      .join(', ') || '∅';

  const jsonString = JSON.stringify(machine, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setTab('math')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'math'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> 5-Tuple Mathematical Definition
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'json'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Raw Engine JSON
          </button>
        </div>

        {tab === 'math' ? (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="font-bold text-primary-600 dark:text-primary-400 block mb-1">
                Formal Tuple: M = (Q, Σ, δ, q₀, F)
              </span>
              <p className="font-sans text-xs text-gray-500 dark:text-gray-400">
                Machine Type:{' '}
                <strong className="text-gray-700 dark:text-gray-200 uppercase">
                  {machine.type}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">
                  Q (Set of States)
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">
                  {'{ ' + stateNames + ' }'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">
                  Σ (Alphabet)
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">
                  {'{ ' + alphabetStr + ' }'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">
                  q₀ (Initial State)
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {startStateLabel}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">
                  F (Set of Accepting States)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {'{ ' + acceptingLabels + ' }'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans mb-1">
                  δ (Transition Rules — {machine.transitions.length} total)
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                  {machine.transitions.map((t) => {
                    const fromLabel =
                      machine.states.find((s) => s.id === t.from)?.label ?? t.from;
                    const toLabel =
                      machine.states.find((s) => s.id === t.to)?.label ?? t.to;
                    return (
                      <div key={t.id}>
                        δ({fromLabel}, '{t.symbol}') → {toLabel}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl text-xs font-mono max-h-80 overflow-y-auto">
              {jsonString}
            </pre>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700"
              leftIcon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
