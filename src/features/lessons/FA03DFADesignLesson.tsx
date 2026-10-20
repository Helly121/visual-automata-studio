import { useState } from 'react';
import { Lightbulb, Play, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';
import { simulateDFA, exampleDFAEndingIn01, exampleDFAEvenOnes } from '@/engine';
import { Button } from '@/components/ui';

// ─── Knowledge Check Questions ───────────────────────────────────────────────

const complementDfaQuestion: KnowledgeCheckQuestion = {
  id: 'fa-03-q1',
  type: 'multiple-choice',
  prompt: 'Given a complete DFA M = (Q, Σ, δ, q₀, F) accepting language L, how do you construct a DFA M\' that accepts the complement language L\' = Σ* \\ L?',
  options: [
    {
      id: 'opt1',
      text: 'Reverse all transition directions in δ.',
      isCorrect: false,
      explanation: 'Reversing transitions typically yields an NFA and corresponds to language reversal Lᴿ, not complementation.',
    },
    {
      id: 'opt2',
      text: 'Swap the accepting states: F\' = Q \\ F, keeping Q, Σ, δ, and q₀ identical.',
      isCorrect: true,
      explanation: 'Because every string produces exactly one deterministic computation path ending in some state q, swapping accepting and non-accepting states inverts acceptance for every string.',
    },
    {
      id: 'opt3',
      text: 'Change the start state q₀ to any final state f ∈ F.',
      isCorrect: false,
      explanation: 'Changing the initial state changes the language recognized in an unpredictable way, not to the complement.',
    },
    {
      id: 'opt4',
      text: 'Add epsilon transitions between all non-accepting states.',
      isCorrect: false,
      explanation: 'DFAs cannot contain epsilon transitions, and this does not invert acceptance.',
    },
  ],
  explanation: 'Complementation of a DFA is achieved by swapping the set of accepting states F\' = Q \\ F. Determinism and totality ensure every string halts in exactly one state.',
  hints: [
    'Remember that every string in Σ* drives a DFA to a unique single final state.',
    'What happens if every state that previously accepted now rejects, and vice-versa?',
  ],
  points: 10,
};

const deadStateQuestion: KnowledgeCheckQuestion = {
  id: 'fa-03-q2',
  type: 'true-false',
  prompt: 'True or False: In a total DFA, a "dead state" (or trap state) is an accepting state from which no transitions lead away.',
  options: [
    {
      id: 'opt-t',
      text: 'True',
      isCorrect: false,
      explanation: 'A dead state is non-accepting; once entered, the machine can never accept the string.',
    },
    {
      id: 'opt-f',
      text: 'False',
      isCorrect: true,
      explanation: 'Correct! A dead state is strictly NON-ACCEPTING and self-loops on all alphabet symbols, ensuring that any string entering it is permanently rejected.',
    },
  ],
  explanation: 'A dead state d ∉ F satisfies δ(d, a) = d for all a ∈ Σ. It serves as a sink for strings that can never belong to the target language.',
  hints: [
    'Can a machine ever accept after falling into a dead state?',
    'Is a trap state meant to accept or permanently reject?',
  ],
  points: 10,
};

const mod3DivisibilityQuestion: KnowledgeCheckQuestion = {
  id: 'fa-03-q3',
  type: 'short-answer',
  prompt: 'For a binary divisibility-by-3 DFA starting at q₀ (remainder 0), what is the remainder state after reading the binary string "110"? (Enter q0, q1, or q2)',
  correctAnswer: 'q0',
  acceptedAliases: ['q_0', 'q0', '{q0}', '0'],
  explanation: 'Binary "110" is 6 in decimal. Since 6 mod 3 = 0, the machine halts in state q₀ (remainder 0).',
  hints: [
    'Convert binary "110" to its decimal value: 1·4 + 1·2 + 0·1.',
    'What is 6 modulo 3?',
  ],
  points: 10,
};

// ─── Worked Example ──────────────────────────────────────────────────────────

const mod3WorkedExample: StepWorkedExample = {
  id: 'we-fa03-mod3',
  title: 'Designing a Binary Divisibility-by-3 DFA',
  problemStatement: 'Construct a DFA over alphabet Σ = {0, 1} that accepts a binary string w if and only if the integer represented by w (in binary, reading MSB to LSB) is divisible by 3.',
  steps: [
    {
      stepNumber: 1,
      title: 'Define the States Based on Modulo Remainders',
      description: 'Any integer n when divided by 3 has one of three possible remainders: 0, 1, or 2. We allocate one state for each remainder.',
      formulaOrCode: 'Q = { q₀, q₁, q₂ }, where qᵢ represents (value mod 3) = i.',
      explanation: 'q₀ is the initial state (empty string represents value 0, 0 mod 3 = 0) and the only accepting state (F = {q₀}).',
    },
    {
      stepNumber: 2,
      title: 'Derive the State Transition Recurrence',
      description: 'When a new binary digit b ∈ {0, 1} arrives at the end of string w, the new numerical value is 2 · val(w) + b.',
      formulaOrCode: 'val(wb) mod 3 = (2 · (val(w) mod 3) + b) mod 3',
      explanation: 'Shifting left in binary multiplies the existing value by 2.',
    },
    {
      stepNumber: 3,
      title: 'Calculate Transitions for Each State',
      description: 'Compute δ(qᵢ, b) for all i ∈ {0, 1, 2} and b ∈ {0, 1}:',
      formulaOrCode:
        'δ(q₀, 0) = (2·0 + 0) mod 3 = 0 → q₀\n' +
        'δ(q₀, 1) = (2·0 + 1) mod 3 = 1 → q₁\n' +
        'δ(q₁, 0) = (2·1 + 0) mod 3 = 2 → q₂\n' +
        'δ(q₁, 1) = (2·1 + 1) mod 3 = 0 → q₀\n' +
        'δ(q₂, 0) = (2·2 + 0) mod 3 = 1 → q₁\n' +
        'δ(q₂, 1) = (2·2 + 1) mod 3 = 2 → q₂',
      explanation: 'Notice that each remainder state transitions deterministically to a well-defined remainder state.',
    },
    {
      stepNumber: 4,
      title: 'Verify with Test String "1001" (9 in decimal)',
      description: 'Start at q₀:\n• Read 1: δ(q₀, 1) = q₁\n• Read 0: δ(q₁, 0) = q₂\n• Read 0: δ(q₂, 0) = q₁\n• Read 1: δ(q₁, 1) = q₀',
      formulaOrCode: 'Path: q₀ →(1) q₁ →(0) q₂ →(0) q₁ →(1) q₀ ∈ F',
      explanation: '9 is divisible by 3, and the machine halts in accepting state q₀.',
    },
  ],
  conclusion: 'The resulting 3-state DFA accurately computes (val(w) mod 3) on the fly without storing the unbounded full integer.',
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3 tracking-tight">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{children}</p>;
}
function Def({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Concept</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{term}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}
function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-xl mb-4">
      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{children}</p>
    </div>
  );
}
function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-4 my-4 font-mono text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre">
      {children}
    </div>
  );
}
function ExampleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Design Pattern</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</p>
      {children}
    </div>
  );
}

// ─── Interactive DFA Tester (Reusing Phase 2 Engine) ─────────────────────────

function InteractiveDFATester() {
  const [inputVal, setInputVal] = useState('1001');
  const [selectedAutomaton, setSelectedAutomaton] = useState<'ending01' | 'evenOnes'>('ending01');

  const activeFa = selectedAutomaton === 'ending01' ? exampleDFAEndingIn01 : exampleDFAEvenOnes;
  const result = simulateDFA(activeFa, inputVal);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Interactive Automata Execution Engine
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedAutomaton('ending01')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              selectedAutomaton === 'ending01'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Ends in "01"
          </button>
          <button
            onClick={() => setSelectedAutomaton('evenOnes')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              selectedAutomaton === 'evenOnes'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Even Number of 1s
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Test arbitrary binary strings directly against this compiled reference DFA from the studio engine:
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value.replace(/[^01]/g, ''))}
          placeholder="Enter binary string (e.g. 1001)"
          className="flex-1 px-3 py-1.5 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold">
          {result.accepted ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> ACCEPTED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" /> REJECTED
            </span>
          )}
        </div>
      </div>

      {/* Execution Trace */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono">
        <div className="text-gray-400 dark:text-gray-500 mb-1.5 text-[11px] uppercase tracking-wider font-sans">
          State Transition Path (Length: {result.trace.length} states):
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {result.trace.map((step, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  idx === result.trace.length - 1
                    ? result.accepted
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {step.activeStateIds[0] ?? ''}
              </span>
              {step.consumedSymbol && (
                <span className="text-gray-400 dark:text-gray-500 flex items-center">
                  --({step.consumedSymbol})--&gt;
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
        <span className="text-gray-500 dark:text-gray-400">Want to inspect and modify this automaton in full 2D space?</span>
        <NavLink to="/playground">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Open Studio Canvas
          </Button>
        </NavLink>
      </div>
    </div>
  );
}

// ─── SVG Diagram for Mod-3 DFA ───────────────────────────────────────────────

function Mod3Diagram() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4 flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 self-start font-mono">
        State Diagram: Binary Divisible by 3 (L = {'{'} w ∈ {'{'}0, 1{'}'}* | val(w) mod 3 = 0 {'}'})
      </p>
      <svg viewBox="0 0 420 180" className="w-full max-w-md">
        <defs>
          <marker id="arr-mod3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Start arrow */}
        <line x1="15" y1="90" x2="55" y2="90" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="5" y="84" fontSize="10" fill="#94a3b8" fontFamily="monospace">start</text>

        {/* q0: rem 0 (initial & accepting) */}
        <circle cx="90" cy="90" r="26" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
        <circle cx="90" cy="90" r="21" fill="none" stroke="#2563eb" strokeWidth="1.5" />
        <text x="90" y="95" textAnchor="middle" fontSize="13" fill="#1d4ed8" fontWeight="700" fontFamily="monospace">q₀</text>

        {/* q0 self loop on 0 */}
        <path d="M 75 66 Q 90 35 105 66" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="90" y="42" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0</text>

        {/* q0 -> q1 on 1 */}
        <path d="M 115 80 Q 165 50 215 80" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="165" y="60" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">1</text>

        {/* q1: rem 1 */}
        <circle cx="240" cy="90" r="26" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="240" y="95" textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700" fontFamily="monospace">q₁</text>

        {/* q1 -> q0 on 1 */}
        <path d="M 215 100 Q 165 130 115 100" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="165" y="125" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">1</text>

        {/* q1 -> q2 on 0 */}
        <path d="M 265 80 Q 315 50 365 80" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="315" y="60" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0</text>

        {/* q2: rem 2 */}
        <circle cx="370" cy="90" r="26" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="370" y="95" textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700" fontFamily="monospace">q₂</text>

        {/* q2 -> q1 on 0 */}
        <path d="M 365 100 Q 315 130 265 100" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="315" y="125" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0</text>

        {/* q2 self loop on 1 */}
        <path d="M 355 66 Q 370 35 385 66" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-mod3)" />
        <text x="370" y="42" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">1</text>
      </svg>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        Q = {'{'} q₀, q₁, q₂ {'}'}, F = {'{'} q₀ {'}'}. States correspond exactly to remainder modulo 3.
      </p>
    </div>
  );
}

// ─── Main Lesson Component ───────────────────────────────────────────────────

export function FA03DFADesignLesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-03" />
      </div>

      <P>
        Designing finite automata requires developing strong mathematical intuition for <strong>state memory</strong>.
        Because a finite automaton has bounded, static memory, every state must represent an equivalence class of
        prefixes that share identical future continuation requirements.
      </P>

      <H2>1. Core Design Patterns</H2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Def term="Pattern 1: Suffix Tracking">
          Track the most recent k symbols seen so far. Useful for languages like "ends with 01" or "contains 101". The states remember the longest valid prefix of the target pattern.
        </Def>
        <Def term="Pattern 2: Counting & Parity">
          Track numerical properties modulo k (such as odd/even count of symbols, or binary divisibility). Bounded arithmetic is natively regular.
        </Def>
      </div>

      <ExampleCard title='Strings Ending in "01" (Alphabet Σ = {0, 1})'>
        <P>
          To detect whether a string ends in "01", we need states that remember how much of the suffix has been matched:
        </P>
        <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-2 font-mono">
          <li><strong>q₀:</strong> Start / nothing relevant seen (or last symbol was 1, not matching prefix '0').</li>
          <li><strong>q₁:</strong> Just read a '0' — halfway to matching target suffix '01'.</li>
          <li><strong>q₂ (Accepting):</strong> Just read '1' immediately preceded by '0' — target suffix satisfied!</li>
        </ul>
      </ExampleCard>

      <H2>2. Live Simulation & Exploration</H2>
      <InteractiveDFATester />

      <H2>3. Worked Example: Binary Divisibility</H2>
      <P>
        One of the classic exam problems in automata theory is constructing an automaton that tests whether an incoming
        binary number is divisible by a fixed integer k. Below is the step-by-step mathematical construction for k = 3.
      </P>

      <Mod3Diagram />
      <WorkedExample example={mod3WorkedExample} />

      <H2>4. The Complement DFA Construction</H2>
      <P>
        A powerful theorem in automata theory states that regular languages are closed under complementation:
      </P>
      <MathBlock>
        If L is regular, then L' = Σ* \ L is also regular.
      </MathBlock>
      <P>
        <strong>Construction:</strong> Let M = (Q, Σ, δ, q₀, F) be a complete DFA for L. The automaton M' = (Q, Σ, δ, q₀, Q \ F)
        accepts exactly L'. Because M is deterministic and total, every string w ∈ Σ* reaches a unique state q = δ̂(q₀, w).
        String w is accepted by M' if and only if q ∈ (Q \ F), which is true if and only if q ∉ F (i.e. w is rejected by M).
      </P>

      <Insight>
        <strong>Warning:</strong> Complementation by swapping accepting states works <em>strictly on DFAs</em>!
        Doing this on an NFA does NOT generally yield the complement language because an NFA can accept if <em>any</em> path
        halts in an accepting state.
      </Insight>

      <H2>5. Knowledge Check</H2>
      <div className="space-y-4 mb-8">
        <KnowledgeCheck question={complementDfaQuestion} />
        <KnowledgeCheck question={deadStateQuestion} />
        <KnowledgeCheck question={mod3DivisibilityQuestion} />
      </div>

      <H2>6. Key Takeaways</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'State Meaning: Every state must have a clear invariant (e.g. "remainder 2" or "saw 0").',
            'Totality: Every DFA state must have an outgoing transition for every symbol in Σ.',
            'Dead States: Non-recoverable failures transition to a non-accepting sink state.',
            'Complement: Invert DFA acceptance by setting F\' = Q \\ F.',
            'Modulo arithmetic on numbers presented in binary is regular and solved with remainder states.',
          ].map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {pt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
