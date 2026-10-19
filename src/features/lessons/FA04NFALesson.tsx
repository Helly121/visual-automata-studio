import { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, ArrowRight, GitBranch } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';
import { simulateNFA, simulateENFA, exampleNFAContains01, exampleENFAaStar } from '@/engine';
import { Button } from '@/components/ui';

// ─── Knowledge Check Questions ───────────────────────────────────────────────

const nfaDeltaSignatureQuestion: KnowledgeCheckQuestion = {
  id: 'fa-04-q1',
  type: 'multiple-choice',
  prompt: 'In the formal definition of an NFA with ε-transitions (ε-NFA), what is the domain and codomain of the transition function δ?',
  options: [
    {
      id: 'opt1',
      text: 'δ: Q × Σ → Q',
      isCorrect: false,
      explanation: 'This is the total transition function of a DFA, which maps to a single state and excludes ε.',
    },
    {
      id: 'opt2',
      text: 'δ: Q × (Σ ∪ {ε}) → 2^Q',
      isCorrect: true,
      explanation: 'In an ε-NFA, δ accepts an internal state and either an input symbol or ε, and outputs a subset of states (an element of the power set 2^Q).',
    },
    {
      id: 'opt3',
      text: 'δ: 2^Q × Σ → Q',
      isCorrect: false,
      explanation: 'The inputs are an individual state and symbol, not a subset of states.',
    },
    {
      id: 'opt4',
      text: 'δ: Q × Σ → 2^Q',
      isCorrect: false,
      explanation: 'While this describes an NFA without ε-transitions, a general ε-NFA must also include ε in its alphabet domain (Σ ∪ {ε}).',
    },
  ],
  explanation: 'An ε-NFA transition function is defined as δ: Q × (Σ ∪ {ε}) → 2^Q, allowing 0, 1, or multiple destination states for any symbol or empty step.',
  hints: [
    'Non-determinism allows branching into zero, one, or multiple states (a subset).',
    'ε-transitions do not consume an input character from Σ.',
  ],
  points: 10,
};

const nfaAcceptanceCriteriaQuestion: KnowledgeCheckQuestion = {
  id: 'fa-04-q2',
  type: 'true-false',
  prompt: 'True or False: An NFA accepts an input string w only if every possible computation path terminates in an accepting state.',
  options: [
    {
      id: 'opt-t',
      text: 'True',
      isCorrect: false,
      explanation: 'If all paths had to accept, it would be an alternating/universal automaton. An NFA requires only AT LEAST ONE accepting path.',
    },
    {
      id: 'opt-f',
      text: 'False',
      isCorrect: true,
      explanation: 'Correct! By definition, an NFA accepts w if there exists AT LEAST ONE valid sequence of choices that leads to some final state q ∈ F.',
    },
  ],
  explanation: 'Non-deterministic acceptance is existential ("there exists a path that accepts"), not universal. A single successful path is sufficient for acceptance even if 99 other paths die.',
  hints: [
    'Think of non-determinism as "lucky guessing" or parallel world exploration.',
    'Does one winning path win the race?',
  ],
  points: 10,
};

const epsilonClosureQuestion: KnowledgeCheckQuestion = {
  id: 'fa-04-q3',
  type: 'short-answer',
  prompt: 'Consider states q₀, q₁, q₂ where δ(q₀, ε) = {q₁} and δ(q₁, ε) = {q₂}. What is the size (number of states) of ε-closure(q₀)? (Enter a single integer)',
  correctAnswer: '3',
  acceptedAliases: ['3', 'three', '{q0, q1, q2}'],
  explanation: 'ε-closure(q₀) = {q₀, q₁, q₂}. Every state is always in its own ε-closure (0 steps), and q₁ (1 step) and q₂ (2 steps) are reachable via ε-transitions.',
  hints: [
    'Every state is in its own ε-closure by reflexivity.',
    'Follow all chains of ε transitions transitively.',
  ],
  points: 10,
};

// ─── Worked Example ──────────────────────────────────────────────────────────

const nfaComputationWorkedExample: StepWorkedExample = {
  id: 'we-fa04-nfa-trace',
  title: 'Tracing NFA Tree Execution on "010"',
  problemStatement: 'Trace all computation branches of the NFA recognizing L = { w | w contains "010" } starting at q₀ on input string "010".',
  steps: [
    {
      stepNumber: 1,
      title: 'Initial State Configuration',
      description: 'Before reading any symbols, the automaton is in state q₀.',
      formulaOrCode: 'Active states: { q₀ } | Remaining input: "010"',
      explanation: 'q₀ self-loops on {0, 1} (guessing when the substring begins) and has δ(q₀, 0) = {q₀, q₁}.',
    },
    {
      stepNumber: 2,
      title: 'Read First Symbol "0" — Branch Creation',
      description: 'From q₀ on symbol 0, the machine branches non-deterministically into two parallel paths: staying in q₀ (guessing "not start yet") and advancing to q₁ (guessing "start of 010").',
      formulaOrCode: 'δ(q₀, 0) = { q₀, q₁ } | Remaining input: "10"',
      explanation: 'The machine is now simultaneously in states {q₀, q₁}.',
    },
    {
      stepNumber: 3,
      title: 'Read Second Symbol "1"',
      description: 'Compute transitions for each currently active state on symbol 1:\n• From q₀: δ(q₀, 1) = { q₀ }\n• From q₁: δ(q₁, 1) = { q₂ }',
      formulaOrCode: 'Active states: { q₀ } ∪ { q₂ } = { q₀, q₂ } | Remaining input: "0"',
      explanation: 'Branch 2 successfully progressed from q₁ to q₂ because the expected "1" was read.',
    },
    {
      stepNumber: 4,
      title: 'Read Third Symbol "0" & Check Acceptance',
      description: 'Compute transitions for { q₀, q₂ } on symbol 0:\n• From q₀: δ(q₀, 0) = { q₀, q₁ }\n• From q₂: δ(q₂, 0) = { q₃ } (q₃ is accepting)\nUnion of active states: { q₀, q₁, q₃ }',
      formulaOrCode: 'Final active states: { q₀, q₁, q₃ }. Since q₃ ∈ F, string is ACCEPTED!',
      explanation: 'Even though branches ending in q₀ and q₁ did not accept, the branch reaching q₃ satisfies the existential acceptance condition.',
    },
  ],
  conclusion: 'The computation tree contains 3 branches at the end of string "010". Because at least one branch halts in accepting state q₃, "010" is accepted.',
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Formal Definition</p>
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

// ─── Live NFA / ε-NFA Interactive Tester ──────────────────────────────────────

function InteractiveNFATester() {
  const [inputVal, setInputVal] = useState('010');
  const [mode, setMode] = useState<'nfa01' | 'enfaStar'>('nfa01');

  const isEnfa = mode === 'enfaStar';
  const result = isEnfa ? simulateENFA(exampleENFAaStar, inputVal) : simulateNFA(exampleNFAContains01, inputVal);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          Interactive Multi-Branch NFA Simulator
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('nfa01')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              mode === 'nfa01'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            NFA: Contains "01"
          </button>
          <button
            onClick={() => setMode('enfaStar')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              mode === 'enfaStar'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            ε-NFA: a*b
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {isEnfa
          ? 'Tracing ε-closure and non-deterministic state expansion for language a*b:'
          : 'Tracing parallel branching states for language containing substring "01":'}
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value.toLowerCase().replace(/[^01ab]/g, ''))}
          placeholder={isEnfa ? 'Enter string (e.g. aaab)' : 'Enter binary string (e.g. 010)'}
          className="flex-1 px-3 py-1.5 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

      {/* Step by step active state subsets */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono">
        <div className="text-gray-400 dark:text-gray-500 mb-2 text-[11px] uppercase tracking-wider font-sans">
          Computation Tree Step Sets (Parallel States):
        </div>
        <div className="space-y-1.5">
          {result.trace.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500 w-16">
                {idx === 0 ? 'Start:' : `Read '${step.symbolRead}':`}
              </span>
              <span className="bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-semibold text-purple-700 dark:text-purple-300">
                {'{ ' + step.activeStates.join(', ') + ' }'}
              </span>
              {idx === result.trace.length - 1 && (
                <span className={`text-[11px] font-bold ${result.accepted ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {result.accepted ? '→ Contains accepting state ✓' : '→ No accepting state ✗'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
        <span className="text-gray-500 dark:text-gray-400">Explore and design non-deterministic automata visually in the studio:</span>
        <NavLink to="/playground">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Open Playground
          </Button>
        </NavLink>
      </div>
    </div>
  );
}

// ─── SVG Diagram for NFA ─────────────────────────────────────────────────────

function NFADiagram() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4 flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 self-start font-mono">
        NFA for Substring "01" with Non-deterministic Guessing at q₀
      </p>
      <svg viewBox="0 0 380 140" className="w-full max-w-md">
        <defs>
          <marker id="arr-nfa" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Start arrow */}
        <line x1="15" y1="70" x2="50" y2="70" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-nfa)" />
        <text x="5" y="65" fontSize="10" fill="#94a3b8" fontFamily="monospace">start</text>

        {/* q0 */}
        <circle cx="80" cy="70" r="24" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="80" y="75" textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700" fontFamily="monospace">q₀</text>

        {/* q0 self loop on 0, 1 */}
        <path d="M 68 48 Q 80 20 92 48" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-nfa)" />
        <text x="80" y="24" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0, 1</text>

        {/* q0 -> q1 on 0 */}
        <line x1="104" y1="70" x2="186" y2="70" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-nfa)" />
        <text x="145" y="62" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0</text>

        {/* q1 */}
        <circle cx="210" cy="70" r="24" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="210" y="75" textAnchor="middle" fontSize="13" fill="#475569" fontWeight="700" fontFamily="monospace">q₁</text>

        {/* q1 -> q2 on 1 */}
        <line x1="234" y1="70" x2="306" y2="70" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-nfa)" />
        <text x="270" y="62" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">1</text>

        {/* q2 (accepting) */}
        <circle cx="330" cy="70" r="24" fill="#faf5ff" stroke="#9333ea" strokeWidth="2" />
        <circle cx="330" cy="70" r="19" fill="none" stroke="#9333ea" strokeWidth="1.5" />
        <text x="330" y="75" textAnchor="middle" fontSize="13" fill="#7e22ce" fontWeight="700" fontFamily="monospace">q₂</text>

        {/* q2 self loop on 0, 1 */}
        <path d="M 318 48 Q 330 20 342 48" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr-nfa)" />
        <text x="330" y="24" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0, 1</text>
      </svg>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        Notice at q₀ on symbol 0, the machine can stay in q₀ OR move to q₁ (non-determinism).
      </p>
    </div>
  );
}

// ─── Main Lesson Component ───────────────────────────────────────────────────

export function FA04NFALesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-04" />
      </div>

      <P>
        A <strong>Non-deterministic Finite Automaton (NFA)</strong> relaxes the strict rules of a DFA:
        for any given state and symbol, the automaton may transition to zero, one, or multiple states.
        It may also change state spontaneously without consuming any input via <strong>ε-transitions</strong>.
      </P>

      <H2>1. Formal Definition</H2>

      <Def term="Non-deterministic Finite Automaton (ε-NFA)">
        An ε-NFA is a 5-tuple M = (Q, Σ, δ, q₀, F) where:
        <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
          <li><strong>Q</strong> is a finite set of internal states.</li>
          <li><strong>Σ</strong> is a finite, non-empty alphabet.</li>
          <li><strong>δ: Q × (Σ ∪ {'{'}ε{'}'}) → 2^Q</strong> is the transition function mapping to the power set of Q.</li>
          <li><strong>q₀ ∈ Q</strong> is the single start state.</li>
          <li><strong>F ⊆ Q</strong> is the set of accepting (final) states.</li>
        </ul>
      </Def>

      <P>
        Contrast this with a DFA: in an NFA, δ(q, a) can be ∅ (the computation branch dies), a singleton {'{'}p{'}'},
        or a set with multiple states {'{'}p, r, s{'}'} (the machine branches into parallel worlds).
      </P>

      <NFADiagram />

      <H2>2. Epsilon-Transitions and Epsilon-Closure</H2>
      <P>
        An <strong>ε-transition</strong> allows the automaton to make a state transition without reading an input symbol.
        To track all states reachable via zero or more ε-transitions, we define the <strong>ε-closure</strong>:
      </P>

      <MathBlock>
        ε-closure(q) = {'{'} p ∈ Q | p is reachable from q via a path of 0 or more ε-transitions {'}'}
      </MathBlock>

      <P>
        <strong>Recursive Definition for a State Set S ⊆ Q:</strong>
      </P>
      <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono mb-3">
        <li><strong>Base case:</strong> Every state in S is in ε-closure(S) (reflexivity, 0 steps).</li>
        <li><strong>Inductive step:</strong> If p ∈ ε-closure(S) and r ∈ δ(p, ε), then r ∈ ε-closure(S).</li>
        <li>Repeat until no new states can be added (fixed-point convergence).</li>
      </ul>

      <H2>3. Live Simulation & Parallel Branch Exploration</H2>
      <InteractiveNFATester />

      <H2>4. Acceptance in an NFA</H2>
      <P>
        How does an NFA decide whether to accept a string w?
      </P>
      <MathBlock>
        w is accepted by NFA M ⇔ At least one computation path on w halts in a state q ∈ F.
      </MathBlock>
      <P>
        If 99 branches die or halt in non-accepting states, but just 1 branch halts in an accepting state,
        the string is <strong>ACCEPTED</strong>. A string is rejected only when <em>all</em> computation branches fail.
      </P>

      <Insight>
        <strong>Expressive Equivalence:</strong> Although NFAs seem far more powerful due to parallel branching and
        lucky guessing, they recognize <strong>exactly the same class of languages</strong> as DFAs (Regular Languages).
        In the next lesson, we prove this constructively using the <em>Subset Construction algorithm</em>.
      </Insight>

      <H2>5. Worked Example: Tracing Computation Tree</H2>
      <WorkedExample example={nfaComputationWorkedExample} />

      <H2>6. Knowledge Check</H2>
      <div className="space-y-4 mb-8">
        <KnowledgeCheck question={nfaDeltaSignatureQuestion} />
        <KnowledgeCheck question={nfaAcceptanceCriteriaQuestion} />
        <KnowledgeCheck question={epsilonClosureQuestion} />
      </div>

      <H2>7. Summary</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'An NFA allows 0, 1, or multiple transitions from any state on any symbol.',
            'The transition function maps to subsets: δ: Q × (Σ ∪ {ε}) → 2^Q.',
            'ε-transitions happen spontaneously without consuming an input character.',
            'ε-closure(S) computes all states reachable from S via zero or more ε steps.',
            'An NFA accepts if AT LEAST ONE branch reaches an accepting state.',
          ].map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
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
