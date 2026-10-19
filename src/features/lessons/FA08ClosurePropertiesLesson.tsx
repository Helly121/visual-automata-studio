import { useState } from 'react';
import { Lightbulb, Split } from 'lucide-react';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';

// ─── Knowledge Check Questions ───────────────────────────────────────────────

const infiniteUnionQuestion: KnowledgeCheckQuestion = {
  id: 'fa-08-q1',
  type: 'true-false',
  prompt: 'True or False: Regular languages are closed under INFINITE unions (i.e. the union of infinitely many regular languages is always regular).',
  options: [
    {
      id: 'opt-t',
      text: 'True',
      isCorrect: false,
      explanation: 'Every individual string {w} is a regular language. An infinite union of singletons can form ANY language, including undecidable languages like the Halting Problem!',
    },
    {
      id: 'opt-f',
      text: 'False',
      isCorrect: true,
      explanation: 'Correct! Regular languages are closed strictly under FINITE unions. Infinite unions can construct non-regular languages (e.g. ⋃_{n ≥ 0} {0ⁿ1ⁿ} = {0ⁿ1ⁿ}).',
    },
  ],
  explanation: 'Closure under union holds exclusively for finite unions (L₁ ∪ L₂). Infinite unions can generate any arbitrary formal language.',
  hints: [
    'Can any language be expressed as an infinite union of single strings?',
    'Is {w} regular for any finite string w?',
  ],
  points: 10,
};

const productIntersectionQuestion: KnowledgeCheckQuestion = {
  id: 'fa-08-q2',
  type: 'multiple-choice',
  prompt: 'In the Cartesian product DFA M = M₁ × M₂ recognizing intersection L₁ ∩ L₂, which pairs of states (q₁, q₂) constitute the accepting set F?',
  options: [
    {
      id: 'opt1',
      text: 'Pairs where q₁ ∈ F₁ OR q₂ ∈ F₂ (F = (F₁ × Q₂) ∪ (Q₁ × F₂))',
      isCorrect: false,
      explanation: 'This defines the UNION of the two languages L₁ ∪ L₂, not the intersection.',
    },
    {
      id: 'opt2',
      text: 'Pairs where q₁ ∈ F₁ AND q₂ ∈ F₂ (F = F₁ × F₂)',
      isCorrect: true,
      explanation: 'For a string to belong to both languages simultaneously, the computation must halt in an accepting state of M₁ AND an accepting state of M₂.',
    },
    {
      id: 'opt3',
      text: 'Pairs where q₁ ∈ F₁ and q₂ ∉ F₂',
      isCorrect: false,
      explanation: 'This defines the set difference L₁ \\ L₂.',
    },
    {
      id: 'opt4',
      text: 'All states in Q₁ × Q₂.',
      isCorrect: false,
      explanation: 'Accepting all states accepts Σ*, not the intersection.',
    },
  ],
  explanation: 'For intersection L₁ ∩ L₂, acceptance requires simultaneous acceptance in both component machines: F = F₁ × F₂.',
  hints: [
    'What does "intersection" require regarding membership in both L₁ and L₂?',
  ],
  points: 10,
};

const emptinessDecisionQuestion: KnowledgeCheckQuestion = {
  id: 'fa-08-q3',
  type: 'short-answer',
  prompt: 'Testing whether the language of a DFA is empty (L(M) = ∅) reduces to what standard graph algorithm starting from q₀? (Enter "reachability", "BFS", or "DFS")',
  correctAnswer: 'reachability',
  acceptedAliases: ['reachability', 'bfs', 'dfs', 'graph search', 'breadth first search', 'depth first search'],
  explanation: 'L(M) is non-empty if and only if there is a directed path in the transition graph from start state q₀ to at least one accepting state f ∈ F. This is decided in O(|V| + |E|) time using BFS/DFS graph reachability.',
  hints: [
    'How do you check if any state in F can be reached from q₀?',
    'Think of standard graph traversal.',
  ],
  points: 10,
};

// ─── Worked Example ──────────────────────────────────────────────────────────

const productConstructionWorkedExample: StepWorkedExample = {
  id: 'we-fa08-product',
  title: 'Constructing Product DFA for Intersection L₁ ∩ L₂',
  problemStatement: 'Construct a DFA for L = L₁ ∩ L₂ over Σ = {0, 1}, where:\n• L₁ = { w | w has an even number of 0s } (states A, B; F₁ = {A})\n• L₂ = { w | w ends with 1 } (states X, Y; F₂ = {Y})',
  steps: [
    {
      stepNumber: 1,
      title: 'Define the Product State Space Q₁ × Q₂',
      description: 'The combined DFA runs both machines in parallel on each input symbol.\nStates Q = {A, B} × {X, Y} = { (A, X), (A, Y), (B, X), (B, Y) }.\nStart state: (A, X) (both initial states).',
      formulaOrCode: 'Q_prod = { (A,X), (A,Y), (B,X), (B,Y) } | Start = (A, X)',
      explanation: 'The machine has 2 × 2 = 4 product states.',
    },
    {
      stepNumber: 2,
      title: 'Determine the Accepting Set F',
      description: 'For intersection, both machines must accept. F₁ = {A} and F₂ = {Y}.\nTherefore, F = F₁ × F₂ = { (A, Y) }.',
      formulaOrCode: 'F_prod = { (A, Y) }',
      explanation: 'State (A, Y) indicates even zeros AND ending in 1.',
    },
    {
      stepNumber: 3,
      title: 'Compute Product Transitions δ((p, q), a) = (δ₁(p, a), δ₂(q, a))',
      description: 'Transitions for each symbol:\n• from (A, X): 0 → (B, X); 1 → (A, Y)\n• from (A, Y): 0 → (B, X); 1 → (A, Y)\n• from (B, X): 0 → (A, X); 1 → (B, Y)\n• from (B, Y): 0 → (A, X); 1 → (B, Y)',
      formulaOrCode: 'δ((p, q), a) = (δ₁(p, a), δ₂(q, a)) for all symbols a ∈ {0, 1}',
      explanation: 'Both components update their internal coordinates independently.',
    },
    {
      stepNumber: 4,
      title: 'Test with String "001" (two 0s, ends with 1)',
      description: 'Trace computation:\n• Start: (A, X)\n• Read 0: (B, X)\n• Read 0: (A, X)\n• Read 1: (A, Y) ∈ F! ACCEPTED.',
      formulaOrCode: '(A, X) →(0) (B, X) →(0) (A, X) →(1) (A, Y) ∈ F',
      explanation: '"001" satisfies both conditions and halts in the single accepting state (A, Y).',
    },
  ],
  conclusion: 'The product DFA construction provides a mechanical, constructive proof that regular languages are closed under intersection.',
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3 tracking-tight">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{children}</p>;
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-xl mb-4">
      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{children}</p>
    </div>
  );
}


// ─── Interactive Product Matrix Visualizer ────────────────────────────────────

function ProductMatrixVisualizer() {
  const [operation, setOperation] = useState<'intersection' | 'union' | 'difference'>('intersection');

  // M1 states: {A (accepting), B} (even zeros)
  // M2 states: {X, Y (accepting)} (ends with 1)

  const isAccepting = (m1State: 'A' | 'B', m2State: 'X' | 'Y') => {
    const isM1Acc = m1State === 'A';
    const isM2Acc = m2State === 'Y';

    if (operation === 'intersection') return isM1Acc && isM2Acc;
    if (operation === 'union') return isM1Acc || isM2Acc;
    if (operation === 'difference') return isM1Acc && !isM2Acc;
    return false;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Split className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Cartesian Product Automaton Configuration: M₁ × M₂
        </h3>
        <div className="flex gap-1.5">
          {(['intersection', 'union', 'difference'] as const).map((op) => (
            <button
              key={op}
              onClick={() => setOperation(op)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                operation === op
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Toggle operations to see how the designated accepting states F change in the product state space Q₁ × Q₂:
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-4 font-mono text-xs">
        {[
          { m1: 'A' as const, m2: 'X' as const, label: '(A, X)', desc: 'Even 0s, Ends with 0/ε' },
          { m1: 'A' as const, m2: 'Y' as const, label: '(A, Y)', desc: 'Even 0s, Ends with 1' },
          { m1: 'B' as const, m2: 'X' as const, label: '(B, X)', desc: 'Odd 0s, Ends with 0/ε' },
          { m1: 'B' as const, m2: 'Y' as const, label: '(B, Y)', desc: 'Odd 0s, Ends with 1' },
        ].map((cell) => {
          const acc = isAccepting(cell.m1, cell.m2);
          return (
            <div
              key={cell.label}
              className={`p-3 rounded-xl border text-center transition-all ${
                acc
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              <div className="font-bold text-sm mb-1">{cell.label}</div>
              <div className="text-[10px] text-gray-400 font-sans mb-1.5">{cell.desc}</div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${acc ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {acc ? 'ACCEPTING' : 'NON-ACCEPTING'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300 font-mono">
        <strong>Accepting condition for {operation}:</strong>{' '}
        {operation === 'intersection' && 'F = F₁ × F₂ = { (A, Y) }'}
        {operation === 'union' && 'F = (F₁ × Q₂) ∪ (Q₁ × F₂) = { (A, X), (A, Y), (B, Y) }'}
        {operation === 'difference' && 'F = F₁ × (Q₂ \\ F₂) = { (A, X) }'}
      </div>
    </div>
  );
}

// ─── Main Lesson Component ───────────────────────────────────────────────────

export function FA08ClosurePropertiesLesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-08" />
      </div>

      <P>
        A collection of languages is said to be <strong>closed</strong> under an operation if applying that
        operation to languages in the collection always yields a language belonging to the same collection.
        Regular languages enjoy remarkable closure properties under nearly all standard mathematical operations.
      </P>

      <H2>1. The 5 Fundamental Regular Operations</H2>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th className="py-2.5 px-3 text-left font-bold text-gray-700 dark:text-gray-300">Operation</th>
              <th className="py-2.5 px-3 text-left font-bold text-gray-700 dark:text-gray-300">Definition</th>
              <th className="py-2.5 px-3 text-left font-bold text-gray-700 dark:text-gray-300">Proof Construction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            <tr>
              <td className="py-2.5 px-3 font-semibold text-primary-600">Union</td>
              <td className="py-2.5 px-3 font-mono">L₁ ∪ L₂ = {'{'} w | w ∈ L₁ or w ∈ L₂ {'}'}</td>
              <td className="py-2.5 px-3 text-gray-500">NFA parallel branch from new q₀ via ε-transitions</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-primary-600">Intersection</td>
              <td className="py-2.5 px-3 font-mono">L₁ ∩ L₂ = {'{'} w | w ∈ L₁ and w ∈ L₂ {'}'}</td>
              <td className="py-2.5 px-3 text-gray-500">Cartesian Product DFA: F = F₁ × F₂</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-primary-600">Complement</td>
              <td className="py-2.5 px-3 font-mono">L' = Σ* \ L</td>
              <td className="py-2.5 px-3 text-gray-500">Swap accepting states in DFA: F' = Q \ F</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-primary-600">Concatenation</td>
              <td className="py-2.5 px-3 font-mono">L₁L₂ = {'{'} xy | x ∈ L₁, y ∈ L₂ {'}'}</td>
              <td className="py-2.5 px-3 text-gray-500">Connect F₁ states to q₀₂ via ε-transitions</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-primary-600">Kleene Star</td>
              <td className="py-2.5 px-3 font-mono">L* = ⋃_{'{'}i≥0{'}'} Lⁱ</td>
              <td className="py-2.5 px-3 text-gray-500">New q₀ accepting; ε-loop from F back to q₀</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>2. Cartesian Product Construction</H2>
      <P>
        The product construction simulates two DFAs M₁ and M₂ in lockstep on the exact same input string.
        By merely changing which pairs in Q₁ × Q₂ are designated as final states F, the exact same state graph
        can compute <strong>Intersection</strong>, <strong>Union</strong>, or <strong>Set Difference</strong>!
      </P>

      <ProductMatrixVisualizer />
      <WorkedExample example={productConstructionWorkedExample} />

      <H2>3. Decision Properties of Regular Languages</H2>
      <P>
        An algorithmic question about a language class is a <strong>decision problem</strong> if it can be answered
        with a deterministic YES or NO algorithm that always halts. For regular languages, all standard decision
        problems are <strong>decidable</strong>:
      </P>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Emptiness: L(M) = ∅?</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Decidable in O(|V| + |E|) time using BFS/DFS reachability from start state q₀ to any final state f ∈ F.
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Finiteness: |L(M)| &lt; ∞?</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Decidable by checking for directed cycles on paths that both originate at q₀ and can reach some f ∈ F.
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">Equivalence: L(M₁) = L(M₂)?</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Construct symmetric difference DFA (L₁ ∩ L₂') ∪ (L₁' ∩ L₂) and test if its language is empty!
          </p>
        </div>
      </div>

      <Insight>
        <strong>De Morgan's Laws for Automata:</strong> If you can prove closure under Union and Complement,
        Intersection closure comes for free: L₁ ∩ L₂ = (L₁' ∪ L₂')'. This demonstrates the deep algebraic harmony
        of regular language theory.
      </Insight>

      <H2>4. Knowledge Check</H2>
      <div className="space-y-4 mb-8">
        <KnowledgeCheck question={infiniteUnionQuestion} />
        <KnowledgeCheck question={productIntersectionQuestion} />
        <KnowledgeCheck question={emptinessDecisionQuestion} />
      </div>

      <H2>5. Summary of Unit 1: Finite Automata</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'Regular languages are closed under union, intersection, complement, concatenation, and star.',
            'Closure proofs are constructive (product DFA or ε-NFA constructions).',
            'All fundamental decision problems (Emptiness, Finiteness, Equivalence) are decidable.',
            'Equivalence of DFAs, NFAs, and ε-NFAs completes the theoretical foundation of Finite Automata.',
            'Congratulations on completing Unit 1: Finite Automata!',
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
