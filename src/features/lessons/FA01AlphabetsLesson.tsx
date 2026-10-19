import { Info, Lightbulb } from 'lucide-react';
import { VerifiedBadge, KnowledgeCheck, WorkedExample } from '@/features/learning';
import type { KnowledgeCheckQuestion, StepWorkedExample } from '@/features/learning';

const alphabetDefinitionQuestion: KnowledgeCheckQuestion = {
  id: 'fa-01-q1',
  type: 'multiple-choice',
  prompt: 'Which of the following is NOT a valid alphabet in formal language theory?',
  options: [
    {
      id: 'opt1',
      text: 'Σ = {0, 1}',
      isCorrect: false,
      explanation: 'The standard binary alphabet is finite and non-empty, so it is completely valid.',
    },
    {
      id: 'opt2',
      text: 'Σ = {a, b, c}',
      isCorrect: false,
      explanation: 'A 3-symbol character set is finite and non-empty, which is valid.',
    },
    {
      id: 'opt3',
      text: 'Σ = ∅ (the empty set)',
      isCorrect: true,
      explanation: 'By mathematical definition, an alphabet must be non-empty (Σ ≠ ∅).',
    },
    {
      id: 'opt4',
      text: 'Σ = {0, 1, 2, ..., 9}',
      isCorrect: false,
      explanation: 'The decimal digit alphabet contains exactly 10 symbols and is valid.',
    },
  ],
  explanation: 'By formal definition, an alphabet Σ is a finite, non-empty set of symbols.',
  hints: [
    'Recall the formal definition: an alphabet must be non-empty and finite.',
    'Check if any option has 0 symbols.',
  ],
  points: 10,
};

const emptyStringLengthQuestion: KnowledgeCheckQuestion = {
  id: 'fa-01-q2',
  type: 'short-answer',
  prompt: 'What is the length of the empty string ε (i.e., |ε|)?',
  correctAnswer: '0',
  acceptedAliases: ['zero', '0'],
  explanation: 'The empty string ε contains zero symbols; hence its length |ε| is strictly 0.',
  hints: [
    'How many symbols does the empty string contain?',
    'Enter a single digit.',
  ],
  points: 10,
};

const kleeneStarWorkedExample: StepWorkedExample = {
  id: 'we-fa01-powers',
  title: 'Calculating Alphabet Powers & Cardinality',
  problemStatement: 'Given the binary alphabet Σ = {0, 1}, determine Σ⁰, Σ¹, Σ² and verify the formula |Σᵏ| = |Σ|ᵏ for k = 2.',
  steps: [
    {
      stepNumber: 1,
      title: 'Determine Base Power Σ⁰',
      description: 'By definition, the 0-th power of any alphabet is the set containing only the string of length 0.',
      formulaOrCode: 'Σ⁰ = { ε }',
      explanation: 'Notice that |Σ⁰| = 1 = |Σ|⁰ = 2⁰. The set contains 1 element: the empty string ε.',
    },
    {
      stepNumber: 2,
      title: 'Determine Length-1 Strings Σ¹',
      description: 'The set of all strings of length 1 is simply the alphabet itself.',
      formulaOrCode: 'Σ¹ = { 0, 1 }',
      explanation: 'Here |Σ¹| = 2 = 2¹. Each symbol stands as an independent length-1 string.',
    },
    {
      stepNumber: 3,
      title: 'Compute Cartesian Concatenation Σ²',
      description: 'Σ² = Σ · Σ consists of all combinations of two symbols from Σ.',
      formulaOrCode: 'Σ² = { 00, 01, 10, 11 }',
      explanation: 'Every choice of first symbol (0 or 1) paired with every choice of second symbol (0 or 1) yields 2 × 2 = 4 strings.',
    },
    {
      stepNumber: 4,
      title: 'Verify Cardinality Formula',
      description: 'Check whether |Σᵏ| = |Σ|ᵏ holds for k = 2.',
      formulaOrCode: '|Σ²| = 4, and |Σ|² = 2² = 4  ✓',
      explanation: 'The algebraic combinatorial counting matches the enumerated set elements exactly.',
    },
  ],
  conclusion: 'The powers of Σ group all possible strings by length, forming the foundation of Σ* = Σ⁰ ∪ Σ¹ ∪ Σ² ∪ ...',
};

const kleeneStarQuestion: KnowledgeCheckQuestion = {
  id: 'fa-01-q3',
  type: 'true-false',
  prompt: 'True or False: The Kleene closure Σ* of any alphabet Σ always contains the empty string ε.',
  options: [
    {
      id: 'opt-true',
      text: 'True',
      isCorrect: true,
      explanation: 'By definition, Σ* = Σ⁰ ∪ Σ¹ ∪ Σ² ∪ ..., and Σ⁰ = {ε}. Therefore, ε is always in Σ*.',
    },
    {
      id: 'opt-false',
      text: 'False',
      isCorrect: false,
      explanation: 'Remember that Σ⁰ = {ε} is always the base term included in the infinite union of Σ*.',
    },
  ],
  explanation: 'Σ* unconditionally includes Σ⁰ = {ε}, so ε ∈ Σ* for every alphabet Σ.',
  hints: [
    'Recall the definition of Kleene closure as an infinite union starting with power 0.',
    'What is Σ⁰ for any alphabet?',
  ],
  points: 10,
};

// ─── Shared lesson prose components ──────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3 tracking-tight">{children}</h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2">{children}</h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{children}</p>
  );
}

function Def({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-card mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Definition</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{term}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>
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

function Math({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-gray-800 dark:text-gray-200">
      {children}
    </code>
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

// ─── Lesson FA-01: Alphabets, Strings, Languages ─────────────────────────────

export function FA01AlphabetsLesson() {
  return (
    <div className="space-y-1">
      <div className="mb-4">
        <VerifiedBadge curriculum="VIT Pune Syllabus AY 2026–27" source="Verified Module FA-01" />
      </div>

      <P>
        Before we can talk about automata, we need a precise mathematical vocabulary to describe
        the <em>inputs</em> that machines process and the <em>sets of inputs</em> we care about.
        These foundational concepts—alphabets, strings, and formal languages—underpin all of automata theory.
      </P>

      <H2>1. Alphabets</H2>

      <Def term="Alphabet (Σ)">
        An <strong>alphabet</strong> is any non-empty, finite set of symbols. We conventionally denote it Σ.
      </Def>

      <P>Examples of alphabets:</P>
      <ul className="list-none space-y-1.5 mb-4 pl-0">
        {[
          ['Binary alphabet', 'Σ = {0, 1}', 'Used in digital computing and most textbook examples.'],
          ['Latin lowercase', 'Σ = {a, b, c, …, z}', 'Natural language processing models.'],
          ['DNA alphabet', 'Σ = {A, C, G, T}', 'Bioinformatics and sequence analysis.'],
          ['Single symbol', 'Σ = {a}', 'Useful for unary representations.'],
        ].map(([name, sym, desc]) => (
          <li key={name} className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 shadow-card">
            <div className="flex-shrink-0 w-24 text-[10px] text-gray-400 dark:text-gray-500 font-medium pt-0.5">{name}</div>
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono text-gray-800 dark:text-gray-200 block mb-0.5">{sym}</code>
              <span className="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
            </div>
          </li>
        ))}
      </ul>

      <KnowledgeCheck question={alphabetDefinitionQuestion} />

      <H2>2. Strings</H2>

      <Def term="String (word)">
        A <strong>string</strong> over alphabet Σ is any finite sequence of symbols drawn from Σ.
        The <em>length</em> of a string <em>w</em> is written |<em>w</em>|.
      </Def>

      <Note>
        The special string with zero symbols is called the <strong>empty string</strong> and is
        written <strong>ε</strong> (epsilon). Its length is |ε| = 0.
      </Note>

      <H3>String Operations</H3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {[
          {
            op: 'Concatenation',
            sym: 'xy',
            desc: 'Append string y after string x.',
            ex: 'If x = "ab", y = "cd", then xy = "abcd"',
          },
          {
            op: 'Reversal',
            sym: 'wᴿ',
            desc: 'Write w from right to left.',
            ex: 'If w = "abc", then wᴿ = "cba"',
          },
          {
            op: 'Length',
            sym: '|w|',
            desc: 'Number of symbols in w.',
            ex: '|"hello"| = 5, |ε| = 0',
          },
          {
            op: 'Exponentiation',
            sym: 'wⁿ',
            desc: 'Concatenate w with itself n times.',
            ex: '"ab"³ = "ababab"',
          },
        ].map(({ op, sym, desc, ex }) => (
          <div key={op} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 shadow-card">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{op}</span>
              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-gray-800 dark:text-gray-200">{sym}</code>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{desc}</p>
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{ex}</p>
          </div>
        ))}
      </div>

      <H3>Kleene Star and Plus</H3>
      <P>
        The <strong>Kleene star</strong> <Math>Σ*</Math> denotes the set of all strings
        over Σ, including ε. Formally:
      </P>
      <MathBlock>Σ* = ε ∪ Σ ∪ ΣΣ ∪ ΣΣΣ ∪ …</MathBlock>
      <P>
        The <strong>Kleene plus</strong> <Math>Σ⁺</Math> excludes ε:
      </P>
      <MathBlock>Σ⁺ = Σ ∪ ΣΣ ∪ ΣΣΣ ∪ … = Σ* \ {'{'} ε {'}'}</MathBlock>

      <Insight>
        For any non-empty alphabet Σ, the set Σ* is <strong>countably infinite</strong>. We can
        enumerate all strings by length, and within each length by lexicographic order.
      </Insight>

      <KnowledgeCheck question={emptyStringLengthQuestion} />

      <WorkedExample example={kleeneStarWorkedExample} />

      <H2>3. Formal Languages</H2>

      <Def term="Formal Language">
        A <strong>formal language</strong> L over alphabet Σ is any subset of Σ*.
        <br />That is: L ⊆ Σ*
      </Def>

      <P>
        A language is simply a set of strings. It can be finite, infinite, or even empty.
        The empty language <Math>∅</Math> contains no strings at all.
      </P>

      <Example title="Languages over Σ = {a, b}">
        <ul className="space-y-1.5">
          {[
            ['L₁ = {ε, a, b, aa, ab}', 'A finite language of 5 strings'],
            ['L₂ = {aⁿbⁿ | n ≥ 0}', 'All strings with equal counts of a and b (context-free)'],
            ['L₃ = {w | w = wᴿ}', 'All palindromes over {a, b}'],
            ['L₄ = ∅', 'The empty language — no strings at all'],
            ['L₅ = Σ*', 'All possible strings — the universal language'],
          ].map(([lang, desc]) => (
            <li key={lang} className="flex items-start gap-3 text-sm">
              <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-800 dark:text-gray-200 flex-shrink-0 mt-0.5">
                {lang}
              </code>
              <span className="text-gray-500 dark:text-gray-400">{desc}</span>
            </li>
          ))}
        </ul>
      </Example>

      <H3>Language Operations</H3>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operation</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notation</th>
              <th className="text-left py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Definition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              ['Union', 'L₁ ∪ L₂', '{w | w ∈ L₁ or w ∈ L₂}'],
              ['Intersection', 'L₁ ∩ L₂', '{w | w ∈ L₁ and w ∈ L₂}'],
              ['Complement', 'L̄ or Σ* \\ L', '{w ∈ Σ* | w ∉ L}'],
              ['Concatenation', 'L₁ · L₂', '{xy | x ∈ L₁, y ∈ L₂}'],
              ['Kleene Star', 'L*', 'L⁰ ∪ L¹ ∪ L² ∪ … (L⁰ = {ε})'],
            ].map(([op, note, def]) => (
              <tr key={op}>
                <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300 text-xs">{op}</td>
                <td className="py-2.5 pr-4">
                  <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-gray-800 dark:text-gray-200">{note}</code>
                </td>
                <td className="py-2.5 text-xs text-gray-500 dark:text-gray-400">{def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KnowledgeCheck question={kleeneStarQuestion} />

      <H2>4. The Chomsky Hierarchy (Preview)</H2>
      <P>
        Not all languages are equally expressive. Noam Chomsky classified formal languages into a hierarchy
        of four types, each recognised by a different class of machine:
      </P>
      <div className="space-y-2 mb-4">
        {[
          { type: 'Type 3 — Regular', machine: 'Finite Automaton (DFA/NFA)', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950' },
          { type: 'Type 2 — Context-Free', machine: 'Pushdown Automaton (PDA)', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950' },
          { type: 'Type 1 — Context-Sensitive', machine: 'Linear-Bounded Automaton', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950' },
          { type: 'Type 0 — Recursively Enumerable', machine: 'Turing Machine', color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950' },
        ].map(({ type, machine, color }) => (
          <div key={type} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-card">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${color}`}>{type}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{machine}</span>
          </div>
        ))}
      </div>

      <Insight>
        In this course we start at the bottom of the hierarchy with <strong>regular languages</strong> and
        finite automata — the simplest but most practically useful class — and work our way up to Turing
        machines and the limits of computation.
      </Insight>

      <H2>5. Summary</H2>
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <ul className="space-y-2">
          {[
            'An alphabet Σ is a finite, non-empty set of symbols.',
            'A string w over Σ is a finite sequence of symbols; ε is the empty string.',
            'Σ* is the (infinite) set of all strings over Σ, including ε.',
            'A formal language L is any subset of Σ*.',
            'Languages support operations: union, intersection, complement, concatenation, Kleene star.',
            'The Chomsky hierarchy ranks languages by the power of the machine needed to recognise them.',
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
