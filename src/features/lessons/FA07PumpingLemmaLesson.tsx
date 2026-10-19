import { useState } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';

// ─── Knowledge Check Questions ───────────────────────────────────────────────

const pumpingLemmaConditionsQuestion: KnowledgeCheckQuestion = {
  id: 'fa-07-q1',
  type: 'multiple-choice',
  prompt: 'In the Pumping Lemma for regular languages, which condition guarantees that the pumpable substring y lies entirely within the first p symbols of the string s?',
  options: [
    {
      id: 'opt1',
      text: '|y| > 0',
      isCorrect: false,
      explanation: '|y| > 0 ensures that y is non-empty, but does not constrain where y is located.',
    },
    {
      id: 'opt2',
      text: '|xy| ≤ p',
      isCorrect: true,
      explanation: 'Condition 2 states |xy| ≤ p. Since the combined prefix xy has length at most p, the substring y must be located within the first p characters of string s.',
    },
    {
      id: 'opt3',
      text: 'xyⁱz ∈ L for all i ≥ 0',
      isCorrect: false,
      explanation: 'This is the pumping condition itself, not the location constraint.',
    },
    {
      id: 'opt4',
      text: '|s| ≥ p',
      isCorrect: false,
      explanation: '|s| ≥ p is the precondition for selecting string s, not a property of partition y.',
    },
  ],
  explanation: 'Condition 2 (|xy| ≤ p) is crucial in proofs because it restricts the alphabet composition of y to the first p characters of the chosen string s.',
  hints: [
    'Which condition places a length upper bound on the prefix x followed by y?',
    'Look for the inequality with p.',
  ],
  points: 10,
};

const pumpingConverseQuestion: KnowledgeCheckQuestion = {
  id: 'fa-07-q2',
  type: 'true-false',
  prompt: 'True or False: If a language satisfies the conditions of the Pumping Lemma, then that language is guaranteed to be regular.',
  options: [
    {
      id: 'opt-t',
      text: 'True',
      isCorrect: false,
      explanation: 'The Pumping Lemma is a NECESSARY condition for regularity, NOT a sufficient condition. There exist non-regular languages that satisfy the pumping lemma.',
    },
    {
      id: 'opt-f',
      text: 'False',
      isCorrect: true,
      explanation: 'Correct! The Pumping Lemma is an implication: Regular ⇒ Pumpable. Its contrapositive (Not Pumpable ⇒ Non-Regular) proves non-regularity, but pumpability alone does NOT prove regularity.',
    },
  ],
  explanation: 'The Pumping Lemma cannot be used to prove a language is regular. It can only be used by contradiction to prove that a language is NOT regular.',
  hints: [
    'Is the Pumping Lemma an "if-and-only-if" condition or a one-way implication?',
    'If A ⇒ B, does B imply A?',
  ],
  points: 10,
};

const pumpingDownQuestion: KnowledgeCheckQuestion = {
  id: 'fa-07-q3',
  type: 'short-answer',
  prompt: 'In a pumping lemma proof, setting the pumping exponent i to what integer value corresponds to "pumping down" (deleting substring y)? (Enter an integer)',
  correctAnswer: '0',
  acceptedAliases: ['0', 'zero', 'i=0', 'i = 0'],
  explanation: 'Setting i = 0 eliminates y completely (since y⁰ = ε), producing the string xz. This is called "pumping down" and is often effective for inequality languages like aⁱbʲ where i < j.',
  hints: [
    'What exponent makes y⁰ equal to the empty string ε?',
  ],
  points: 10,
};

// ─── Worked Example ──────────────────────────────────────────────────────────

const pumping0n1nWorkedExample: StepWorkedExample = {
  id: 'we-fa07-0n1n',
  title: 'Proving L = { 0ⁿ1ⁿ | n ≥ 0 } is Not Regular',
  problemStatement: 'Use the Pumping Lemma for regular languages to prove by contradiction that the language L = { 0ⁿ1ⁿ | n ≥ 0 } over Σ = {0, 1} is not regular.',
  steps: [
    {
      stepNumber: 1,
      title: 'Assume L is Regular by Contradiction',
      description: 'Assume L is regular. Then by the Pumping Lemma, there exists a pumping length p ≥ 1.',
      formulaOrCode: 'Assume L is regular ⇒ ∃ p ≥ 1 satisfying conditions (1), (2), (3).',
      explanation: 'We assume regularity to establish an impossible contradiction with the lemma.',
    },
    {
      stepNumber: 2,
      title: 'Choose a String s ∈ L with |s| ≥ p',
      description: 'Select string s = 0ᵖ1ᵖ. Note that s ∈ L because the number of 0s equals the number of 1s (both equal p), and |s| = 2p ≥ p.',
      formulaOrCode: 's = 0ᵖ1ᵖ ∈ L, |s| = 2p ≥ p',
      explanation: 'Selecting s parameterized by p ensures the string is long enough to invoke the lemma.',
    },
    {
      stepNumber: 3,
      title: 'Analyze the Adversary\'s Partition s = xyz',
      description: 'The Pumping Lemma states that s can be partitioned into xyz such that:\n1. |y| > 0\n2. |xy| ≤ p\nBecause |xy| ≤ p and the first p characters of s are all 0s, the substring y MUST consist entirely of zeros!\nLet y = 0ᵏ for some 1 ≤ k ≤ p.',
      formulaOrCode: 'x = 0ᵃ, y = 0ᵏ (k ≥ 1), z = 0^(p-a-k) 1ᵖ',
      explanation: 'Condition 2 traps y strictly within the opening block of 0s. y cannot contain any 1s!',
    },
    {
      stepNumber: 4,
      title: 'Pump String with i = 2 to Produce Contradiction',
      description: 'Consider string s\' = xy²z (pumping up by repeating y):\ns\' = xyyz = 0^(p+k) 1ᵖ.\nSince k ≥ 1, the number of zeros in s\' is p + k > p, while the number of ones remains exactly p!',
      formulaOrCode: 's\' = 0^(p+k) 1ᵖ ∉ L because (p + k) ≠ p',
      explanation: 'The Pumping Lemma claims s\' must belong to L, but s\' has unequal counts of 0s and 1s!',
    },
  ],
  conclusion: 'This contradiction shows our assumption that L is regular must be false. Therefore, L = { 0ⁿ1ⁿ | n ≥ 0 } is NOT regular.',
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
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Fundamental Lemma</p>
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

// ─── Interactive Decomposition Explorer ──────────────────────────────────────

function PumpingDecompositionVisualizer() {
  const [pVal] = useState(4);
  const [pumpI, setPumpI] = useState(2);
  const yLen = 2; // length of y (0s)
  const xLen = 1;

  // s = 0000 1111 (p=4)
  // x = 0 (1), y = 00 (2), z = 0 1111 (1 zero + 4 ones)
  const xStr = '0'.repeat(xLen);
  const yStr = '0'.repeat(yLen);
  const zStr = '0'.repeat(pVal - xLen - yLen) + '1'.repeat(pVal);

  const pumpedString = xStr + yStr.repeat(pumpI) + zStr;
  const numZeros = xLen + yLen * pumpI + (pVal - xLen - yLen);
  const numOnes = pVal;
  const isInLanguage = numZeros === numOnes;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Interactive String Pumping Visualizer: s = 0ᵖ1ᵖ (p = 4)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">Pump exponent i:</span>
          {[0, 1, 2, 3].map((val) => (
            <button
              key={val}
              onClick={() => setPumpI(val)}
              className={`px-2.5 py-1 text-xs rounded font-mono font-bold transition-colors ${
                pumpI === val
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              i = {val}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Notice how varying the exponent <em>i</em> breaks the symmetry between the number of 0s and 1s:
      </p>

      {/* Decomposition Banner */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 font-mono text-xs">
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className="text-gray-400">Partition:</span>
          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
            x = "{xStr}"
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold ring-2 ring-purple-500">
            y = "{yStr}" (repeated {pumpI}×)
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
            z = "{zStr}"
          </span>
        </div>
        <div className="text-[11px] text-gray-500">
          Resulting pumped string xy^{pumpI}z: <strong>"{pumpedString}"</strong>
        </div>
      </div>

      {/* Comparison metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Number of 0s</span>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-0.5">{numZeros}</p>
        </div>
        <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Number of 1s</span>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-0.5">{numOnes}</p>
        </div>
        <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col justify-center">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Belongs to L?</span>
          <div className="mt-1 font-bold">
            {isInLanguage ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> YES (#0 = #1)
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> NO (#0 ≠ #1)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Lesson Component ───────────────────────────────────────────────────

export function FA07PumpingLemmaLesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-07" />
      </div>

      <P>
        Not all formal languages can be recognized by finite automata. Because a finite automaton has
        a strictly <em>finite number of states</em>, it cannot count or store unbounded quantities.
        The <strong>Pumping Lemma</strong> is the primary mathematical tool used to prove that a language is <strong>not regular</strong>.
      </P>

      <H2>1. The Pigeonhole Principle Intuition</H2>
      <P>
        Imagine a DFA with p states. If it processes any string s of length |s| ≥ p, the computation path
        must visit at least p + 1 states (including the initial state).
      </P>
      <Insight>
        <strong>Pigeonhole Principle:</strong> By placing p + 1 state visits into p distinct states,
        at least ONE state must be visited more than once! That loop can be traversed 0 times, 1 time,
        or any number of times without changing the remainder of the path.
      </Insight>

      <H2>2. The Pumping Lemma Statement</H2>

      <Def term="The Pumping Lemma for Regular Languages">
        If L is a regular language, then there exists an integer p ≥ 1 (called the <em>pumping length</em>)
        such that every string s ∈ L with |s| ≥ p can be partitioned into three substrings s = xyz satisfying:
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-xs">
          <li><strong>|y| &gt; 0</strong> (the pumpable loop is non-empty)</li>
          <li><strong>|xy| ≤ p</strong> (the loop occurs within the first p symbols)</li>
          <li><strong>For all i ≥ 0, xyⁱz ∈ L</strong> (the loop can be repeated arbitrarily)</li>
        </ol>
      </Def>

      <H2>3. The Adversarial Game Methodology</H2>
      <P>
        Proofs using the Pumping Lemma are structured as a 4-step adversarial game by contradiction:
      </P>
      <div className="space-y-2 mb-4">
        {[
          ['1. Assume', 'Assume L is regular. The lemma grants an unknown pumping length p ≥ 1.'],
          ['2. Choose s', 'YOU pick a clever string s ∈ L with |s| ≥ p parameterized by p.'],
          ['3. Adversary splits', 'The adversary divides s into xyz under rules |y| > 0 and |xy| ≤ p.'],
          ['4. Deliver punchline', 'YOU pick an exponent i ≥ 0 such that xyⁱz ∉ L. Contradiction!'],
        ].map(([step, desc]) => (
          <div key={step} className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-card">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0 w-32">{step}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{desc}</span>
          </div>
        ))}
      </div>

      <H2>4. Interactive String Pumping Visualizer</H2>
      <PumpingDecompositionVisualizer />

      <H2>5. Step-by-Step Worked Example: 0ⁿ1ⁿ</H2>
      <WorkedExample example={pumping0n1nWorkedExample} />

      <H2>6. Common Non-Regular Languages</H2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1 font-mono">L = {'{'} wwᴿ {'}'} (Palindromes)</p>
          <p className="text-xs text-gray-500">Requires unbounded LIFO memory to match characters in reverse order.</p>
        </div>
        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1 font-mono">L = {'{'} 0^(n²) | n ≥ 0 {'}'} (Square Powers)</p>
          <p className="text-xs text-gray-500">The gap between consecutive squares (n+1)² - n² = 2n + 1 grows unbounded, violating constant pump step |y| ≤ p.</p>
        </div>
      </div>

      <H2>7. Knowledge Check</H2>
      <div className="space-y-4 mb-8">
        <KnowledgeCheck question={pumpingLemmaConditionsQuestion} />
        <KnowledgeCheck question={pumpingConverseQuestion} />
        <KnowledgeCheck question={pumpingDownQuestion} />
      </div>

      <H2>8. Summary</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'The Pumping Lemma is a necessary condition for regularity derived from the pigeonhole principle.',
            'Condition |xy| ≤ p forces the pumpable loop y to live in the first p symbols.',
            'Condition |y| > 0 ensures progress so pumping alters the string length.',
            'Setting i = 0 pumps down; i ≥ 2 pumps up.',
            'It can only prove non-regularity; it cannot prove a language is regular.',
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
