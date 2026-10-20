import {
  Cpu,
  Code2,
  Milestone,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button } from '@/components/ui';
import { units } from '@/data/units';
import { NavLink } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="animate-fade-in max-w-4xl space-y-8">
      <PageHeader
        title="About Visual Automata Studio"
        description="A specialized interactive laboratory and computational workbench for Automata Theory and Formal Languages."
      />

      {/* Hero Overview */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="blue">Academic Year 2026–27</Badge>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Vishwakarma Institute of Technology, Pune
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Bridging Mathematical Rigor with Visual Computation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Automata Theory is often taught as an abstract, paper-and-pencil mathematical discipline involving formal 5-tuples,
              complex delta transition matrices, and induction proofs. <strong>Visual Automata Studio</strong> transforms these theoretical
              constructs into an interactive, visual medium where students can build state machines, watch tape heads traverse cells,
              inspect nondeterministic branching trees, and step through subset constructions in real time.
            </p>
          </div>
        </div>
      </div>

      {/* Syllabus Units Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              VIT Pune Syllabus Alignment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Structured strictly according to the 6 core units of the official curriculum.
            </p>
          </div>
          <NavLink to="/learn">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Units
            </Button>
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    Unit 0{unit.number}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {unit.totalLessons} Lessons
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {unit.shortTitle}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {unit.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  ~{unit.estimatedHours} hours
                </span>
                <NavLink
                  to={`/learn/${unit.id}`}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View Unit &rarr;
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Modern Developer-Grade Tech Stack
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Engineered for fast, zero-latency browser computation with no external runtime dependencies:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {[
            { name: 'React 19', role: 'Component hierarchy & concurrent rendering' },
            { name: 'TypeScript', role: 'Strict formal language type safety' },
            { name: 'Vite 8', role: 'Instant HMR development & optimized bundling' },
            { name: 'Tailwind CSS', role: 'Design token system with dark mode' },
            { name: '@xyflow/react', role: 'Vector node-graph canvas orchestration' },
            { name: 'Lucide Icons', role: 'Harmonious semantic interface iconography' },
          ].map(({ name, role }) => (
            <div
              key={name}
              className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800"
            >
              <div className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{name}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">{role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture & Engineering Roadmap */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-card space-y-5">
        <div className="flex items-center gap-2">
          <Milestone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Implementation Roadmap
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
              1
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Phase 1: Foundation, UI & Design System
                </span>
                <Badge variant="green">Current Phase</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Clean Canvas design system, responsive navigation shell, syllabus dashboard, interactive mock workspace,
                lesson registry, and rich Unit I DFA educational module.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
              2
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Phase 2: Graph Editor & Simulation Engine
                </span>
                <Badge variant="blue">Upcoming</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Full React Flow graph editor with node creation, labeled directed edges, step-by-step token stream simulation,
                instant acceptance verification, and batch test harness.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
              3
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Phase 3: Formal Transformations & Reductions
                </span>
                <Badge variant="green">Available</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Interactive automated subset construction (NFA &rarr; DFA), table-filling state minimisation,
                Thompson's regex-to-NFA synthesis, and CNF grammar normalization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
