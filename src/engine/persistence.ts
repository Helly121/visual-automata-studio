import { PROJECT_FORMAT_VERSION, type SavedProject, type FiniteAutomaton } from './types.ts';

/**
 * Serialize a machine to a versioned JSON project string.
 */
export function serializeProject(
  machine: FiniteAutomaton,
  name: string,
  description: string,
  nodePositions: Record<string, { x: number; y: number }>,
): string {
  const project: SavedProject = {
    formatVersion: PROJECT_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    name,
    description,
    machine,
    nodePositions,
  };
  return JSON.stringify(project, null, 2);
}

/**
 * Parse and validate a project JSON string.
 * Throws with a user-friendly message if the file is malformed.
 */
export function deserializeProject(raw: string): SavedProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Project file must be a JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj['formatVersion'] !== PROJECT_FORMAT_VERSION) {
    throw new Error(
      `Unknown project format version ${String(obj['formatVersion'])}. Expected ${PROJECT_FORMAT_VERSION}.`,
    );
  }

  if (typeof obj['name'] !== 'string') throw new Error('Project is missing a valid "name" field.');
  if (typeof obj['machine'] !== 'object' || obj['machine'] === null) {
    throw new Error('Project is missing a valid "machine" field.');
  }

  const machine = obj['machine'] as Record<string, unknown>;
  if (!['dfa', 'nfa', 'enfa'].includes(machine['type'] as string)) {
    throw new Error(`Invalid machine type "${String(machine['type'])}".`);
  }
  if (!Array.isArray(machine['states'])) throw new Error('Machine must have a "states" array.');
  if (!Array.isArray(machine['alphabet'])) throw new Error('Machine must have an "alphabet" array.');
  if (!Array.isArray(machine['transitions'])) throw new Error('Machine must have a "transitions" array.');

  return parsed as SavedProject;
}

/**
 * Trigger a browser download of the serialized project.
 */
export function downloadProject(blob: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([blob], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
