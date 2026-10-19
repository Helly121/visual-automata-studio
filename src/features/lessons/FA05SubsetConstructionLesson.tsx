import { useState } from 'react';
import { Lightbulb, Play, RefreshCw, CheckCircle2, Layers } from 'lucide-react';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';
import { Button } from '@/components/ui';

// ─── Knowledge Check Questions ───────────────────────────────────────────────

const subsetMaxStatesQuestion: KnowledgeCheckQuestion = {
  id: 'fa-05-q1',
  type: 'multiple-choice',
  prompt: 'If an NFA has n states, what is the theoretical maximum number of states in the equivalent DFA produced by the subset construction?',
  options: [
    {
      id: 'opt1',
      text: 'n',
      isCorrect: false,
      explanation: 'An equivalent DFA often requires more states than the NFA to track combinations of concurrent branches.',
    },
    {
      id: 'opt2',
      text: 'n²',
      isCorrect: false,
      explanation: 'n² is the bound for the Cartesian product construction of two NFAs/DFAs, not the power set.',
    },
    {
      id: 'opt3',
      text: '2^n',
      isCorrect: true,
      explanation: 'Because every state in the DFA corresponds to a subset of the NFA states (an element of the power set 2^Q), there are at most 2^n possible states.',
    },
    {
      id: 'opt4',
      text: 'n!',
      isCorrect: false,
      explanation: 'Factorial complexity is not the bound for subsets.',
    },
  ],
  explanation: 'The power set of a set with n elements has 2^n elements. While most practical DFAs use far fewer reachable states, the theoretical worst-case bound is 2^n.',
  hints: [
    'How many subsets can be formed from a set of size n?',
    'Think of binary strings of length n indicating whether each state is included.',
  ],
  points: 10,
};

const subsetAcceptanceConditionQuestion: KnowledgeCheckQuestion = {
  id: 'fa-05-q2',
  type: 'true-false',
  prompt: 'True or False: In the subset construction, a DFA state S = {q_a, q_b, ..., q_k} is an accepting state if and only if EVERY state in S is an accepting state of the NFA.',
  options: [
    {
      id: 'opt-t',
      text: 'True',
      isCorrect: false,
      explanation: 'If every state had to accept, the DFA would require universal acceptance, changing the language.',
    },
    {
      id: 'opt-f',
      text: 'False',
      isCorrect: true,
      explanation: 'Correct! Because an NFA accepts when AT LEAST ONE branch reaches an accepting state, a DFA subset state S is accepting if S ∩ F_N ≠ ∅ (it contains at least one accepting state).',
    },
  ],
  explanation: 'A subset state S in the DFA is accepting if S contains ANY accepting state of the NFA (i.e. S ∩ F_N ≠ ∅).',
  hints: [
    'Recall NFA acceptance semantics: does an NFA require all branches to accept, or just at least one?',
  ],
  points: 10,
};

const subsetTrapStateQuestion: KnowledgeCheckQuestion = {
  id: 'fa-05-q3',
  type: 'short-answer',
  prompt: 'In the subset construction, what mathematical symbol represents the dead/trap state corresponding to the empty subset of NFA states? (Enter ∅ or {})',
  correctAnswer: '∅',
  acceptedAliases: ['∅', '{}', 'phi', 'empty', 'empty set', 'none'],
  explanation: 'The empty set ∅ represents a DFA state where all active NFA computational branches have died. In a total DFA, ∅ transitions to itself on all symbols.',
  hints: [
    'What is the subset containing zero states?',
    'Enter ∅ or {}.',
  ],
  points: 10,
};

// ─── Worked Example ──────────────────────────────────────────────────────────

const subsetWorkedExample: StepWorkedExample = {
  id: 'we-fa05-subset-step',
  title: 'Converting an NFA for "Ends with 01" to a DFA',
  problemStatement: 'Convert the 3-state NFA N = ({q₀, q₁, q₂}, {0, 1}, δ, q₀, {q₂}) with transitions δ(q₀, 0) = {q₀, q₁}, δ(q₀, 1) = {q₀}, and δ(q₁, 1) = {q₂} into an equivalent DFA.',
  steps: [
    {
      stepNumber: 1,
      title: 'Initialize the DFA Start State',
      description: 'The start state of the DFA is the ε-closure of the NFA start state. Since there are no ε-transitions, the start state is simply {q₀}.',
      formulaOrCode: 'DFA State A = { q₀ }',
      explanation: 'A does not contain q₂, so A is not accepting.',
    },
    {
      stepNumber: 2,
      title: 'Expand Transitions from State A = {q₀}',
      description: 'Compute transitions on symbols 0 and 1:\n• on 0: δ_N(q₀, 0) = {q₀, q₁} → New state B!\n• on 1: δ_N(q₀, 1) = {q₀} → State A',
      formulaOrCode: 'δ_D(A, 0) = B = { q₀, q₁ }\nδ_D(A, 1) = A = { q₀ }',
      explanation: 'We add B = {q₀, q₁} to our queue of states to process.',
    },
    {
      stepNumber: 3,
      title: 'Expand Transitions from State B = {q₀, q₁}',
      description: 'Compute transitions for each member in B:\n• on 0: δ_N(q₀, 0) ∪ δ_N(q₁, 0) = {q₀, q₁} ∪ ∅ = {q₀, q₁} = B\n• on 1: δ_N(q₀, 1) ∪ δ_N(q₁, 1) = {q₀} ∪ {q₂} = {q₀, q₂} → New state C!',
      formulaOrCode: 'δ_D(B, 0) = B = { q₀, q₁ }\nδ_D(B, 1) = C = { q₀, q₂ }',
      explanation: 'State C = {q₀, q₂} contains q₂ ∈ F_N, so C IS AN ACCEPTING STATE!',
    },
    {
      stepNumber: 4,
      title: 'Expand Transitions from State C = {q₀, q₂}',
      description: 'Compute transitions from C on 0 and 1 (q₂ has no outgoing transitions):\n• on 0: δ_N(q₀, 0) ∪ δ_N(q₂, 0) = {q₀, q₁} ∪ ∅ = B\n• on 1: δ_N(q₀, 1) ∪ δ_N(q₂, 1) = {q₀} ∪ ∅ = A',
      formulaOrCode: 'δ_D(C, 0) = B = { q₀, q₁ }\nδ_D(C, 1) = A = { q₀ }',
      explanation: 'All generated states {A, B, C} are now closed under all input symbols. The algorithm halts!',
    },
  ],
  conclusion: 'The resulting DFA has 3 states: A = {q₀} (start), B = {q₀, q₁}, and C = {q₀, q₂} (accepting). Notice 3 < 2³ = 8 states.',
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Theoretical Theorem</p>
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

// ─── Interactive Subset Construction Stepper ─────────────────────────────────

interface SubsetStep {
  name: string;
  setStr: string;
  isAccepting: boolean;
  trans0: string;
  trans1: string;
}

const tableSteps: SubsetStep[] = [
  { name: 'A', setStr: '{ q₀ }', isAccepting: false, trans0: 'B {q₀, q₁}', trans1: 'A {q₀}' },
  { name: 'B', setStr: '{ q₀, q₁ }', isAccepting: false, trans0: 'B {q₀, q₁}', trans1: 'C {q₀, q₂}' },
  { name: 'C', setStr: '{ q₀, q₂ }', isAccepting: true, trans0: 'B {q₀, q₁}', trans1: 'A {q₀}' },
];

function SubsetConstructionInteractive() {
  const [currentStep, setCurrentStep] = useState(1);

  const visibleRows = tableSteps.slice(0, currentStep);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Interactive Subset Construction Worklist Stepper
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentStep >= tableSteps.length}
            onClick={() => setCurrentStep((s) => Math.min(s + 1, tableSteps.length))}
            rightIcon={<Play className="w-3.5 h-3.5" />}
          >
            Expand Next Subset ({currentStep}/{tableSteps.length})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentStep(1)}
            aria-label="Reset Stepper"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Watch the deterministic state table build dynamically from the NFA worklist:
      </p>

      <div className="overflow-x-auto mb-3">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th className="py-2 px-3 text-left">DFA State</th>
              <th className="py-2 px-3 text-left">Subset of NFA States</th>
              <th className="py-2 px-3 text-left">Accepting?</th>
              <th className="py-2 px-3 text-left">δ_D(S, 0)</th>
              <th className="py-2 px-3 text-left">δ_D(S, 1)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibleRows.map((r) => (
              <tr key={r.name} className="animate-fade-in hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td className="py-2 px-3 font-bold text-primary-600 dark:text-primary-400">{r.name}</td>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{r.setStr}</td>
                <td className="py-2 px-3">
                  {r.isAccepting ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> YES (contains q₂)
                    </span>
                  ) : (
                    <span className="text-gray-400">NO</span>
                  )}
                </td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{r.trans0}</td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{r.trans1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentStep < tableSteps.length ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Play className="w-3.5 h-3.5" /> Click "Expand Next Subset" to process the pending target state in the queue.
        </p>
      ) : (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> All generated target states have been expanded. Construction complete!
        </p>
      )}
    </div>
  );
}

// ─── Main Lesson Component ───────────────────────────────────────────────────

export function FA05SubsetConstructionLesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-05" />
      </div>

      <P>
        The <strong>Subset Construction</strong> (also called the <em>Rabin-Scott Powers-set construction</em>)
        is the landmark theoretical algorithm proving that Deterministic and Non-deterministic Finite Automata
        have <strong>identical computational power</strong>. Every NFA can be converted into an equivalent DFA.
      </P>

      <H2>1. The Power-Set Theorem</H2>

      <Def term="Equivalence of DFA and NFA">
        A language L is recognized by an NFA if and only if L is recognized by some DFA.
      </Def>

      <P>
        <strong>Intuition:</strong> In an NFA, after reading any prefix of the input string, the machine is in
        some <em>subset</em> of its states Q_N. Since a set of size n has exactly 2^n subsets, a deterministic
        machine can track the exact set of active NFA states using at most 2^n states.
      </P>

      <H2>2. The Formal Algorithm</H2>
      <P>
        Given an ε-NFA N = (Q_N, Σ, δ_N, q₀, F_N), construct DFA D = (Q_D, Σ, δ_D, q₀_D, F_D):
      </P>

      <MathBlock>
        1. Start State: q₀_D = ε-closure({'{'}q₀{'}'}){'\n'}
        2. Alphabet: Identical Σ (excluding ε){'\n'}
        3. Transition Function:{'\n'}
           For each subset S ⊆ Q_N and symbol a ∈ Σ:{'\n'}
           δ_D(S, a) = ε-closure( ⋃_(p ∈ S) δ_N(p, a) ){'\n'}
        4. Accepting States:{'\n'}
           F_D = {'{'} S ∈ Q_D | S ∩ F_N ≠ ∅ {'}'}
      </MathBlock>

      <H2>3. Interactive Worklist Stepper</H2>
      <SubsetConstructionInteractive />

      <H2>4. Step-by-Step Worked Example</H2>
      <WorkedExample example={subsetWorkedExample} />

      <Insight>
        <strong>Dead States in the DFA:</strong> If for some subset S and symbol a, no NFA state has transitions,
        then δ_D(S, a) = ∅. In the DFA, the empty set ∅ becomes an explicit, non-accepting sink state that self-loops
        on all symbols.
      </Insight>

      <H2>5. Worst-Case Exponential Blowup</H2>
      <P>
        While most practical NFAs produce small DFAs (as seen above with 3 states), the worst-case bound of 2^n is tight!
      </P>
      <P>
        <strong>Classic Example:</strong> The language L_k = {'{'} w ∈ {'{'}0, 1{'}'}* | the k-th symbol from the end is 1 {'}'}.
        An NFA requires only <strong>k + 1 states</strong> (it guesses when it is k symbols from the end).
        However, any DFA recognizing L_k strictly requires <strong>2^k states</strong>, because it must remember
        the entire binary history of the last k symbols!
      </P>

      <H2>6. Knowledge Check</H2>
      <div className="space-y-4 mb-8">
        <KnowledgeCheck question={subsetMaxStatesQuestion} />
        <KnowledgeCheck question={subsetAcceptanceConditionQuestion} />
        <KnowledgeCheck question={subsetTrapStateQuestion} />
      </div>

      <H2>7. Summary</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'Subset construction converts an NFA to an equivalent DFA.',
            'Each DFA state represents a subset of NFA states.',
            'DFA start state is ε-closure(q₀).',
            'A DFA state S is accepting if it contains at least one NFA final state (S ∩ F_N ≠ ∅).',
            'Worst-case state complexity is 2^n, but lazy reachability only constructs reachable states.',
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
