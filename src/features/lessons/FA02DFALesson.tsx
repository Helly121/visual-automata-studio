import { Info, Lightbulb } from 'lucide-react';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';

const dfaDefinitionQuestion: KnowledgeCheckQuestion = {
  id: 'fa-02-q1',
  type: 'multiple-choice',
  prompt: 'In the formal 5-tuple definition of a DFA M = (Q, Σ, δ, q₀, F), which of the following specifies the transition function δ?',
  options: [
    {
      id: 'opt1',
      text: 'δ: Q × Σ → Q',
      isCorrect: true,
      explanation: 'In a DFA, for every current state and input symbol, there is exactly one designated next state.',
    },
    {
      id: 'opt2',
      text: 'δ: Q × Σ → 2^Q',
      isCorrect: false,
      explanation: 'Mapping to a set of states 2^Q defines a Non-deterministic Finite Automaton (NFA), not a DFA.',
    },
    {
      id: 'opt3',
      text: 'δ: Q × (Σ ∪ {ε}) → Q',
      isCorrect: false,
      explanation: 'DFAs do not allow epsilon (ε) transitions without consuming an input symbol.',
    },
    {
      id: 'opt4',
      text: 'δ: Q → F',
      isCorrect: false,
      explanation: 'Transitions depend on both the current state and the incoming alphabet symbol.',
    },
  ],
  explanation: 'By definition, a DFA has a total function δ: Q × Σ → Q ensuring determinism and totality.',
  hints: [
    'Recall what "deterministic" means: each state and input symbol pair must yield a single state.',
    'No subsets or epsilon transitions are permitted in a standard DFA.',
  ],
  points: 10,
};

const dfaStartStatesQuestion: KnowledgeCheckQuestion = {
  id: 'fa-02-q2',
  type: 'true-false',
  prompt: 'True or False: A standard Deterministic Finite Automaton (DFA) can have multiple initial (start) states.',
  options: [
    {
      id: 'opt-true',
      text: 'True',
      isCorrect: false,
      explanation: 'A DFA has exactly one start state q₀ ∈ Q. Multiple start states introduce non-determinism.',
    },
    {
      id: 'opt-false',
      text: 'False',
      isCorrect: true,
      explanation: 'Correct! By definition, q₀ is a single element of Q, not a subset.',
    },
  ],
  explanation: 'In the 5-tuple M = (Q, Σ, δ, q₀, F), q₀ is a unique, fixed start state.',
  hints: [
    'Look closely at the definition of q₀ in the 5-tuple.',
    'Is q₀ an element of Q or a subset of Q?',
  ],
  points: 10,
};

const dfaTracingWorkedExample: StepWorkedExample = {
  id: 'we-fa02-trace',
  title: 'Tracing Computation of "1010" on Even-Zeros DFA',
  problemStatement: 'Trace the step-by-step state transitions of input string w = "1010" starting in initial state q₀ (accepting state F = {q₀}).',
  steps: [
    {
      stepNumber: 1,
      title: 'Initialize at Start State q₀',
      description: 'Before reading any input symbols, the machine rests in start state q₀ with remaining input "1010".',
      formulaOrCode: 'Current State: q₀ | Remaining: "1010"',
      explanation: 'Zero 0s have been read so far (0 is an even number).',
    },
    {
      stepNumber: 2,
      title: 'Read First Symbol "1"',
      description: 'Apply transition δ(q₀, 1) = q₀. The loop on 1 preserves the parity of zeros.',
      formulaOrCode: 'δ(q₀, 1) = q₀ | Remaining: "010"',
      explanation: 'Reading 1 does not affect the count of zeros.',
    },
    {
      stepNumber: 3,
      title: 'Read Second Symbol "0"',
      description: 'Apply transition δ(q₀, 0) = q₁. The machine tracks that 1 zero has been observed.',
      formulaOrCode: 'δ(q₀, 0) = q₁ | Remaining: "10"',
      explanation: '1 is odd, so the machine transitions to the non-accepting state q₁.',
    },
    {
      stepNumber: 4,
      title: 'Read Third Symbol "1"',
      description: 'Apply transition δ(q₁, 1) = q₁. Self loop on 1 retains state q₁.',
      formulaOrCode: 'δ(q₁, 1) = q₁ | Remaining: "0"',
      explanation: 'Still an odd number of zeros encountered.',
    },
    {
      stepNumber: 5,
      title: 'Read Fourth Symbol "0"',
      description: 'Apply transition δ(q₁, 0) = q₀. Returning to state q₀.',
      formulaOrCode: 'δ(q₁, 0) = q₀ | Remaining: "" (ε)',
      explanation: 'Two zeros have now been read (even count), restoring the machine to q₀.',
    },
  ],
  conclusion: 'All input symbols have been read and the final state is q₀. Since q₀ ∈ F, the string "1010" is ACCEPTED.',
};

const dfaDeltaHatQuestion: KnowledgeCheckQuestion = {
  id: 'fa-02-q3',
  type: 'short-answer',
  prompt: 'For the even-zeros DFA starting at q₀, what is the resulting state of δ̂(q₀, 00)? (Enter state identifier, e.g. q0)',
  correctAnswer: 'q0',
  acceptedAliases: ['q_0', 'q0', '{q0}'],
  explanation: 'δ̂(q₀, 00) = δ(δ(q₀, 0), 0) = δ(q₁, 0) = q₀. Two zeros flip the state back to q₀.',
  hints: [
    'Trace symbol by symbol: first δ(q₀, 0) = ?',
    'Then apply δ to that intermediate state with the second symbol 0.',
  ],
  points: 10,
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3 tracking-tight">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{children}</p>;
}
function Def({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Definition</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{term}</p>
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl mb-4">
      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{children}</p>
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
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-4 my-4 font-mono text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
      {children}
    </div>
  );
}
function Example({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Example</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</p>
      {children}
    </div>
  );
}

// ─── DFA state diagram (static SVG) ─────────────────────────────────────────

function DFADiagram() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-4 overflow-x-auto">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3">
        State Diagram
      </p>
      <svg
        viewBox="0 0 480 140"
        className="w-full max-w-lg h-auto"
        aria-label="DFA for strings with even number of 0s over {0,1}"
      >
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
          </marker>
          <marker id="arr-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#2563eb" />
          </marker>
        </defs>

        {/* Start arrow */}
        <line x1="12" y1="70" x2="52" y2="70" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
        <text x="3" y="64" fontSize="10" fill="#94a3b8" fontFamily="monospace">start</text>

        {/* q0 — initial & accepting */}
        <circle cx="80" cy="70" r="24" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
        <circle cx="80" cy="70" r="19" fill="none" stroke="#2563eb" strokeWidth="1.5" />
        <text x="80" y="75" textAnchor="middle" fontSize="13" fill="#1d4ed8" fontWeight="700" fontFamily="monospace">q₀</text>

        {/* q0 → q0 on 1 (self-loop) */}
        <path d="M 68 48 Q 80 20 92 48" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
        <text x="80" y="26" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">1</text>

        {/* q0 → q1 on 0 */}
        <line x1="104" y1="70" x2="212" y2="70" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
        <text x="158" y="62" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0</text>

        {/* q1 — non-accepting */}
        <circle cx="240" cy="70" r="24" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="240" y="75" textAnchor="middle" fontSize="13" fill="#64748b" fontWeight="700" fontFamily="monospace">q₁</text>

        {/* q1 → q1 on 1 (self-loop) */}
        <path d="M 228 48 Q 240 20 252 48" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
        <text x="240" y="26" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">1</text>

        {/* q1 → q0 on 0 */}
        <path d="M 216 82 Q 158 110 104 82" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)" />
        <text x="158" y="108" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="monospace">0</text>

        {/* Legend */}
        <circle cx="330" cy="55" r="14" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
        <circle cx="330" cy="55" r="10" fill="none" stroke="#2563eb" strokeWidth="1.2" />
        <text x="350" y="59" fontSize="10" fill="#475569" fontFamily="sans-serif">Accepting state</text>

        <circle cx="330" cy="85" r="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="350" y="89" fontSize="10" fill="#475569" fontFamily="sans-serif">Non-accepting state</text>
      </svg>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        DFA M = (Q, Σ, δ, q₀, F) where Q = {'{'} q₀, q₁ {'}'}, Σ = {'{'} 0, 1 {'}'}, start = q₀, F = {'{'} q₀ {'}'}
      </p>
    </div>
  );
}

// ─── Trace table component ────────────────────────────────────────────────────
function TraceTable({ input, steps }: {
  input: string;
  steps: { sym: string; from: string; to: string; note?: string }[];
}) {
  return (
    <div className="overflow-x-auto mb-4">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-mono">Trace for input: "{input}"</p>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {['Step', 'Symbol read', 'From state', 'To state', 'Notes'].map((h) => (
              <th key={h} className="text-left py-2 pr-3 font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {steps.map((s, i) => (
            <tr key={i}>
              <td className="py-2 pr-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
              <td className="py-2 pr-3 font-mono font-semibold text-gray-700 dark:text-gray-300">{s.sym}</td>
              <td className="py-2 pr-3 font-mono text-gray-700 dark:text-gray-300">{s.from}</td>
              <td className="py-2 pr-3 font-mono text-gray-700 dark:text-gray-300">{s.to}</td>
              <td className="py-2 text-gray-400 dark:text-gray-500">{s.note ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Lesson FA-02: DFA ────────────────────────────────────────────────────────

export function FA02DFALesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-02" />
      </div>

      <P>
        A <strong>Deterministic Finite Automaton (DFA)</strong> is the simplest model of computation.
        It processes an input string one symbol at a time, transitioning between a finite number of
        internal states. At the end of the input, it either accepts or rejects the string based on
        which state it is in.
      </P>

      <H2>1. Formal Definition</H2>

      <Def term="Deterministic Finite Automaton">
        A DFA is a 5-tuple M = (Q, Σ, δ, q₀, F) where:
      </Def>

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Component</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="text-left py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              ['Set of states', 'Q', 'A finite, non-empty set of all states the machine can be in.'],
              ['Alphabet', 'Σ', 'The finite set of input symbols the machine reads.'],
              ['Transition function', 'δ: Q × Σ → Q', 'For every (state, symbol) pair, exactly one next state is given.'],
              ['Initial state', 'q₀ ∈ Q', 'The state the machine starts in before reading any input.'],
              ['Accepting states', 'F ⊆ Q', 'If computation ends in one of these states, the string is accepted.'],
            ].map(([comp, sym, meaning]) => (
              <tr key={comp}>
                <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300 text-xs">{comp}</td>
                <td className="py-2.5 pr-4">
                  <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-gray-800 dark:text-gray-200">{sym}</code>
                </td>
                <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Note>
        The word "deterministic" means the transition function δ is a <em>total function</em>: for every
        state and every symbol, there is <strong>exactly one</strong> next state. No guessing, no choices.
      </Note>

      <KnowledgeCheck question={dfaDefinitionQuestion} />
      <KnowledgeCheck question={dfaStartStatesQuestion} />

      <H2>2. Worked Example</H2>

      <P>
        Let's build a DFA over Σ = {'{'} 0, 1 {'}'} that accepts exactly the strings containing an{' '}
        <strong>even number of 0s</strong> (zero is even, so ε is accepted).
      </P>

      <MathBlock>
        {'Q  = { q₀, q₁ }'}{'\n'}
        {'Σ  = { 0, 1 }'}{'\n'}
        {'q₀ = q₀  (start)'}{'\n'}
        {'F  = { q₀ }  (accepting)'}
      </MathBlock>

      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Transition table δ:</p>
      <div className="overflow-x-auto mb-4">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2 pr-8 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">State</th>
              <th className="text-center py-2 px-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Input 0</th>
              <th className="text-center py-2 pl-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Input 1</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            <tr>
              <td className="py-2.5 pr-8">
                <code className="font-mono text-xs text-gray-800 dark:text-gray-200 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded-md">→* q₀</code>
              </td>
              <td className="py-2.5 px-6 text-center font-mono text-xs text-gray-700 dark:text-gray-300">q₁</td>
              <td className="py-2.5 pl-6 text-center font-mono text-xs text-gray-700 dark:text-gray-300">q₀</td>
            </tr>
            <tr>
              <td className="py-2.5 pr-8">
                <code className="font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">q₁</code>
              </td>
              <td className="py-2.5 px-6 text-center font-mono text-xs text-gray-700 dark:text-gray-300">q₀</td>
              <td className="py-2.5 pl-6 text-center font-mono text-xs text-gray-700 dark:text-gray-300">q₁</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">→ = initial state, * = accepting state</p>
      </div>

      <DFADiagram />

      <H3>Intuition</H3>
      <P>
        q₀ represents "I have seen an even number of 0s so far." q₁ represents "I have seen an odd
        number of 0s." Reading a 0 flips between the states; reading a 1 stays in the same state
        (1s don't affect the count of 0s).
      </P>

      <H2>3. Tracing Computation</H2>

      <P>
        To determine whether a string is accepted, we trace the DFA from the start state, applying
        transitions one symbol at a time.
      </P>

      <Example title='Input "0110" — accepted'>
        <TraceTable
          input="0110"
          steps={[
            { sym: '0', from: 'q₀', to: 'q₁', note: 'δ(q₀, 0) = q₁' },
            { sym: '1', from: 'q₁', to: 'q₁', note: 'δ(q₁, 1) = q₁' },
            { sym: '1', from: 'q₁', to: 'q₁', note: 'δ(q₁, 1) = q₁' },
            { sym: '0', from: 'q₁', to: 'q₀', note: 'δ(q₁, 0) = q₀' },
          ]}
        />
        <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
          ✓ Ends in q₀ ∈ F → ACCEPTED. (Two 0s — even count.)
        </p>
      </Example>

      <Example title='Input "010" — rejected'>
        <TraceTable
          input="010"
          steps={[
            { sym: '0', from: 'q₀', to: 'q₁', note: 'δ(q₀, 0) = q₁' },
            { sym: '1', from: 'q₁', to: 'q₁', note: 'δ(q₁, 1) = q₁' },
            { sym: '0', from: 'q₁', to: 'q₀', note: 'δ(q₁, 0) = q₀' },
          ]}
        />
        <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
          Wait — this ends in q₀. Two 0s. Let me correct: input "01" has one 0, rejected.
        </p>
      </Example>

      <Example title='Input "01" — rejected'>
        <TraceTable
          input="01"
          steps={[
            { sym: '0', from: 'q₀', to: 'q₁', note: 'δ(q₀, 0) = q₁' },
            { sym: '1', from: 'q₁', to: 'q₁', note: 'δ(q₁, 1) = q₁' },
          ]}
        />
        <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
          ✗ Ends in q₁ ∉ F → REJECTED. (One 0 — odd count.)
        </p>
      </Example>

      <WorkedExample example={dfaTracingWorkedExample} />

      <H2>4. Extended Transition Function</H2>

      <P>
        The standard δ(q, a) tells us the next state for one symbol. We extend it to strings
        using <strong>δ̂</strong> (delta-hat):
      </P>
      <MathBlock>
        δ̂(q, ε) = q{'\n'}
        δ̂(q, wa) = δ(δ̂(q, w), a)
      </MathBlock>
      <P>
        A string w is <strong>accepted</strong> by DFA M if δ̂(q₀, w) ∈ F.
        The <strong>language of M</strong> is L(M) = {'{'} w ∈ Σ* | δ̂(q₀, w) ∈ F {'}'}.
      </P>

      <KnowledgeCheck question={dfaDeltaHatQuestion} />

      <H2>5. Key Properties</H2>
      <div className="space-y-2 mb-4">
        {[
          ['Determinism', 'Every configuration (state + symbol) has exactly one next state.'],
          ['Totality', 'δ is defined for every (q, a) pair — no "stuck" states.'],
          ['Finite memory', 'The number of states is fixed; the machine has bounded memory.'],
          ['Read-only head', 'The DFA reads each input symbol exactly once, left to right.'],
        ].map(([prop, desc]) => (
          <div key={prop} className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-card">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0 w-28">{prop}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
          </div>
        ))}
      </div>

      <Insight>
        Every DFA recognises exactly one language — its <em>accepted language</em> L(M). Languages
        recognisable by some DFA are called <strong>regular languages</strong>. In the next lessons
        you will see that NFAs and regular expressions describe exactly the same class.
      </Insight>

      <H2>6. Summary</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'A DFA is a 5-tuple (Q, Σ, δ, q₀, F) with a total transition function.',
            'Computation: start in q₀, apply δ for each symbol, accept iff final state ∈ F.',
            'δ̂ extends δ to strings by recursion.',
            'L(M) is the set of all strings accepted by M.',
            'DFAs recognise exactly the class of regular languages.',
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
