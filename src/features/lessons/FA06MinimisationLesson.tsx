import { useState } from 'react';
import { Lightbulb, Play, RefreshCw, CheckCircle2, Table } from 'lucide-react';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';
import { Button } from '@/components/ui';

// ─── Knowledge Check Questions ───────────────────────────────────────────────

const tableFillingBaseQuestion: KnowledgeCheckQuestion = {
  id: 'fa-06-q1',
  type: 'multiple-choice',
  prompt: 'In the base step of the Table-Filling DFA minimization algorithm, which pairs of states (p, q) are immediately marked as distinguishable?',
  options: [
    {
      id: 'opt1',
      text: 'Pairs (p, q) where δ(p, a) = δ(q, a) for all a ∈ Σ.',
      isCorrect: false,
      explanation: 'States with identical transitions are candidates for equivalence, not distinguishable.',
    },
    {
      id: 'opt2',
      text: 'Pairs (p, q) where one state is accepting (p ∈ F) and the other is non-accepting (q ∉ F).',
      isCorrect: true,
      explanation: 'The empty string ε immediately distinguishes them: δ̂(p, ε) = p ∈ F while δ̂(q, ε) = q ∉ F.',
    },
    {
      id: 'opt3',
      text: 'Pairs where both states are initial states.',
      isCorrect: false,
      explanation: 'A DFA has only one initial state, and this is not a distinguishability criterion.',
    },
    {
      id: 'opt4',
      text: 'Pairs that share an incoming transition from q₀.',
      isCorrect: false,
      explanation: 'Incoming transitions do not distinguish future acceptance behavior.',
    },
  ],
  explanation: 'Two states where one is in F and the other is not in F are immediately distinguished by the empty string w = ε.',
  hints: [
    'What string of length 0 can test if a state is accepting or not?',
    'Consider w = ε.',
  ],
  points: 10,
};

const myhillNerodeQuestion: KnowledgeCheckQuestion = {
  id: 'fa-06-q2',
  type: 'true-false',
  prompt: 'True or False: According to the Myhill-Nerode Theorem, the minimal DFA for a regular language is unique up to state renaming (isomorphism).',
  options: [
    {
      id: 'opt-t',
      text: 'True',
      isCorrect: true,
      explanation: 'Correct! The Myhill-Nerode theorem proves that the minimal DFA is strictly unique (canonical) for any regular language.',
    },
    {
      id: 'opt-f',
      text: 'False',
      isCorrect: false,
      explanation: 'Unlike NFAs (which can have multiple non-isomorphic minimal representations), the minimal DFA is provably unique.',
    },
  ],
  explanation: 'The Myhill-Nerode equivalence relations define a canonical minimal DFA that is unique up to isomorphism.',
  hints: [
    'Can there be two completely different minimal DFAs for the exact same language?',
  ],
  points: 10,
};

const unreachableStatesQuestion: KnowledgeCheckQuestion = {
  id: 'fa-06-q3',
  type: 'short-answer',
  prompt: 'Before constructing the distinguishability table, what type of states MUST be eliminated first to ensure correct minimization? (Enter "unreachable" or "inaccessible")',
  correctAnswer: 'unreachable',
  acceptedAliases: ['unreachable', 'inaccessible', 'unreachable states', 'dead'],
  explanation: 'Unreachable states cannot be visited from the initial state q₀ by any input string. Removing them first prevents spurious equivalence classes.',
  hints: [
    'What do we call states that have no directed path from the start state q₀?',
  ],
  points: 10,
};

// ─── Worked Example ──────────────────────────────────────────────────────────

const minimisationWorkedExample: StepWorkedExample = {
  id: 'we-fa06-table-filling',
  title: 'Minimizing a 5-State DFA with Table-Filling',
  problemStatement: 'Minimize the DFA with states Q = {q₀, q₁, q₂, q₃, q₄}, Σ = {0, 1}, start q₀, and accepting states F = {q₁, q₂}, where transitions on 0/1 are:\n• q₀: 0→q₁, 1→q₂\n• q₁: 0→q₁, 1→q₃\n• q₂: 0→q₂, 1→q₃\n• q₃: 0→q₄, 1→q₄\n• q₄: 0→q₄, 1→q₄',
  steps: [
    {
      stepNumber: 1,
      title: 'Remove Unreachable States',
      description: 'Perform BFS from start state q₀:\n• Reachable on length 1: {q₁, q₂}\n• Reachable on length 2: {q₃}\n• Reachable on length 3: {q₄}',
      formulaOrCode: 'Reachable Q = {q₀, q₁, q₂, q₃, q₄} (All 5 states are reachable).',
      explanation: 'None of the states are isolated from start state q₀.',
    },
    {
      stepNumber: 2,
      title: 'Base Step: Mark Final vs. Non-Final Pairs',
      description: 'Accepting states F = {q₁, q₂}; Non-accepting Q \\ F = {q₀, q₃, q₄}. Mark all pairs with one state in F and one not in F with "X₀" (distinguished by ε):',
      formulaOrCode: 'Marked: (q₀, q₁), (q₀, q₂), (q₁, q₃), (q₁, q₄), (q₂, q₃), (q₂, q₄)',
      explanation: 'Any string reaching an accepting state vs a non-accepting state differs immediately.',
    },
    {
      stepNumber: 3,
      title: 'Inductive Passes for Unmarked Pairs',
      description: 'Check remaining unmarked pairs:\n• Pair (q₁, q₂): on 0 → (q₁, q₂) [unmarked]; on 1 → (q₃, q₃) [same state]. Neither transition leads to a marked pair! (q₁, q₂) remains unmarked!\n• Pair (q₃, q₄): on 0 → (q₄, q₄); on 1 → (q₄, q₄). Neither leads to a marked pair! (q₃, q₄) remains unmarked!\n• Pair (q₀, q₃): on 0 → (q₁, q₄) [MARKED by X₀] → MARK (q₀, q₃)!',
      formulaOrCode: 'Unmarked pairs at termination: { (q₁, q₂), (q₃, q₄) }',
      explanation: 'States q₁ and q₂ are indistinguishable (equivalent). States q₃ and q₄ are also equivalent.',
    },
    {
      stepNumber: 4,
      title: 'Merge Equivalent State Classes',
      description: 'Group states into equivalence classes:\n• [q₀] (start state)\n• [q₁, q₂] (accepting state)\n• [q₃, q₄] (non-accepting sink state)',
      formulaOrCode: 'Reduced Q_min = { [q₀], [q₁, q₂], [q₃, q₄] } (3 states total)',
      explanation: 'The original 5-state DFA has been compressed to a strictly minimal 3-state DFA.',
    },
  ],
  conclusion: 'The minimal DFA achieves exactly the same language recognition using only 3 states instead of 5.',
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Mathematical Concept</p>
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

// ─── Interactive Triangular Table Simulation ─────────────────────────────────

function InteractiveTableFilling() {
  const [pass, setPass] = useState(0);

  // States: q0, q1, q2, q3
  // F = {q1, q2}
  // Pairs:
  // (q1, q0): diff in pass 1
  // (q2, q0): diff in pass 1
  // (q2, q1): equivalent (never diff)
  // (q3, q0): diff in pass 2 (on 0 goes to (q1, q4) -> diff)
  // (q3, q1): diff in pass 1
  // (q3, q2): diff in pass 1

  const getCellStatus = (row: number, col: number) => {
    // row > col
    const pair = `${row},${col}`;
    if (pass === 0) return { label: '—', color: 'text-gray-300' };

    // Pass 1: Final vs Non-final: q1, q2 in F; q0, q3 not in F
    // (1,0) -> X0
    // (2,0) -> X0
    // (3,1) -> X0
    // (3,2) -> X0
    if (pair === '1,0' || pair === '2,0' || pair === '3,1' || pair === '3,2') {
      return { label: 'X₀ (ε)', color: 'bg-rose-100 text-rose-700 font-bold' };
    }

    if (pass >= 2) {
      if (pair === '3,0') {
        return { label: 'X₁ (0)', color: 'bg-amber-100 text-amber-700 font-bold' };
      }
    }

    if (pass >= 3 && pair === '2,1') {
      return { label: '≡ EQUIV', color: 'bg-emerald-100 text-emerald-700 font-bold' };
    }

    return { label: '—', color: 'text-gray-300' };
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Table className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Interactive Triangular Distinguishability Grid
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pass >= 3}
            onClick={() => setPass((p) => p + 1)}
            rightIcon={<Play className="w-3.5 h-3.5" />}
          >
            {pass === 0 ? 'Start Base Pass (ε)' : pass === 1 ? 'Run Inductive Pass 1' : pass === 2 ? 'Identify Equivalence' : 'Complete'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPass(0)}
            aria-label="Reset Grid"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Step through the Myhill-Nerode table-filling passes for Q = {'{'}q₀, q₁, q₂, q₃{'}'} with F = {'{'}q₁, q₂{'}'}:
      </p>

      {/* Grid */}
      <div className="overflow-x-auto mb-3">
        <div className="inline-block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden font-mono text-xs">
          <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-800 font-bold text-center border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 border-r border-gray-200 dark:border-gray-700">State</div>
            <div className="p-2 border-r border-gray-200 dark:border-gray-700">q₀</div>
            <div className="p-2 border-r border-gray-200 dark:border-gray-700">q₁</div>
            <div className="p-2">q₂</div>
          </div>

          {[
            { id: 'q₁', row: 1 },
            { id: 'q₂', row: 2 },
            { id: 'q₃', row: 3 },
          ].map(({ id, row }) => (
            <div key={id} className="grid grid-cols-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 font-bold text-center border-r border-gray-200 dark:border-gray-700">
                {id}
              </div>
              {[0, 1, 2].map((col) => {
                if (col >= row) {
                  return <div key={col} className="p-2 bg-gray-100/30 dark:bg-gray-800/20 border-r border-gray-100 dark:border-gray-800" />;
                }
                const cell = getCellStatus(row, col);
                return (
                  <div
                    key={col}
                    className={`p-2 text-center border-r border-gray-100 dark:border-gray-800 flex items-center justify-center text-[11px] transition-all duration-300 ${cell.color}`}
                  >
                    {cell.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {pass === 0 && 'Click "Start Base Pass" to mark all pairs distinguished by the empty string ε.'}
        {pass === 1 && 'Base pass complete: Pairs (q₁, q₀), (q₂, q₀), (q₃, q₁), and (q₃, q₂) marked because one is accepting and one is not.'}
        {pass === 2 && 'Inductive pass 1 complete: Pair (q₃, q₀) marked because δ(q₃, 0) = q₄ and δ(q₀, 0) = q₁ form a previously marked pair.'}
        {pass === 3 && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pair (q₁, q₂) remains unmarked! They are equivalent states and merge into [q₁, q₂].
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Lesson Component ───────────────────────────────────────────────────

export function FA06MinimisationLesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-06" />
      </div>

      <P>
        When building DFAs by hand or through automated pipelines like the Subset Construction,
        the resulting state machine often contains redundant, duplicated, or unreachable states.
        <strong>DFA Minimization</strong> eliminates all redundancy to generate the provably smallest possible DFA.
      </P>

      <H2>1. State Distinguishability & Equivalence</H2>

      <Def term="Distinguishable States">
        Two states p, q ∈ Q are <strong>distinguishable</strong> if there exists a string w ∈ Σ* such that:
        <span className="block mt-1 font-mono text-xs">
          δ̂(p, w) ∈ F and δ̂(q, w) ∉ F (or vice-versa).
        </span>
        Such a string w is called a <em>distinguishing witness</em>.
      </Def>

      <Def term="Equivalent States">
        Two states p, q ∈ Q are <strong>equivalent</strong> (written p ≡ q) if for EVERY string w ∈ Σ*:
        <span className="block mt-1 font-mono text-xs">
          δ̂(p, w) ∈ F ⇔ δ̂(q, w) ∈ F.
        </span>
        Equivalent states behave identically under all possible futures and can be safely merged.
      </Def>

      <H2>2. The Table-Filling Algorithm</H2>
      <P>
        The table-filling algorithm (Moore / Hopcroft family) systematically identifies all distinguishable pairs
        using dynamic programming on a triangular table of all state pairs:
      </P>

      <MathBlock>
        Step 1: Eliminate all unreachable states from start state q₀.{'\n'}
        Step 2 (Base Case): For all pairs (p, q), if p ∈ F and q ∉ F (or vice versa),{'\n'}
                mark (p, q) with X₀ (witness is ε).{'\n'}
        Step 3 (Inductive Step): Loop until no new marks can be added:{'\n'}
                For each unmarked pair (p, q) and each symbol a ∈ Σ:{'\n'}
                If (δ(p, a), δ(q, a)) is already marked, then mark (p, q)!{'\n'}
        Step 4: All pairs remaining UNMARKED are equivalent: p ≡ q. Merge them!
      </MathBlock>

      <H2>3. Interactive Table-Filling Grid</H2>
      <InteractiveTableFilling />

      <H2>4. Step-by-Step Worked Example</H2>
      <WorkedExample example={minimisationWorkedExample} />

      <H2>5. The Myhill-Nerode Theorem</H2>
      <P>
        The theoretical foundation of DFA minimization is the celebrated <strong>Myhill-Nerode Theorem</strong>:
      </P>
      <MathBlock>
        A language L is regular ⇔ The number of equivalence classes of the right-invariant relation R_L is finite.{'\n'}
        Furthermore, the number of states in the minimal DFA is EXACTLY equal to the number of equivalence classes of R_L.
      </MathBlock>

      <Insight>
        <strong>Canonical Uniqueness:</strong> Unlike NFAs, where two minimal NFAs for the same language might look
        completely different, the minimal DFA for any regular language is <strong>100% unique</strong> up to isomorphism
        (state renaming). This makes minimal DFAs the standard tool for testing language equivalence!
      </Insight>

      <H2>6. Knowledge Check</H2>
      <div className="space-y-4 mb-8">
        <KnowledgeCheck question={tableFillingBaseQuestion} />
        <KnowledgeCheck question={myhillNerodeQuestion} />
        <KnowledgeCheck question={unreachableStatesQuestion} />
      </div>

      <H2>7. Summary</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'States p and q are distinguishable if some string w sends one to F and the other to Q \\ F.',
            'Always prune unreachable states before starting table-filling.',
            'Base pass marks (Final, Non-Final) pairs via witness ε.',
            'Inductive passes propagate distinguishability backwards along transitions.',
            'Unmarked pairs represent equivalent states that merge into single quotient states.',
            'By Myhill-Nerode, the minimal DFA is canonical and unique.',
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
