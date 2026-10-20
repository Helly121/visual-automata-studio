import type { FiniteAutomaton } from '../types.ts';

/**
 * Automatically layout automaton states into readable (x, y) coordinates
 * based on BFS layer from the initial state.
 */
export function layoutAutomatonGraph(
  fa: FiniteAutomaton,
  options?: {
    startX?: number;
    startY?: number;
    layerSpacingX?: number;
    nodeSpacingY?: number;
  },
): Record<string, { x: number; y: number }> {
  const startX = options?.startX ?? 80;
  const startY = options?.startY ?? 140;
  const layerSpacingX = options?.layerSpacingX ?? 200;
  const nodeSpacingY = options?.nodeSpacingY ?? 130;

  const positions: Record<string, { x: number; y: number }> = {};
  if (fa.states.length === 0) return positions;

  const startId = fa.initialStateId ?? fa.states[0]?.id;
  const layerMap = new Map<string, number>();
  const visited = new Set<string>();

  // BFS to determine layers
  const queue: Array<{ id: string; layer: number }> = [{ id: startId, layer: 0 }];
  visited.add(startId);
  layerMap.set(startId, 0);

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    for (const t of fa.transitions) {
      if (t.from === id && !visited.has(t.to)) {
        visited.add(t.to);
        layerMap.set(t.to, layer + 1);
        queue.push({ id: t.to, layer: layer + 1 });
      }
    }
  }

  // Any unreached states placed in an overflow layer
  let maxLayer = 0;
  for (const l of layerMap.values()) {
    if (l > maxLayer) maxLayer = l;
  }

  for (const state of fa.states) {
    if (!layerMap.has(state.id)) {
      layerMap.set(state.id, maxLayer + 1);
    }
  }

  // Group states by layer
  const layerGroups = new Map<number, string[]>();
  for (const [id, l] of layerMap) {
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l)!.push(id);
  }

  // Assign coordinates
  for (const [layerIndex, stateIds] of layerGroups) {
    const x = startX + layerIndex * layerSpacingX;
    const totalHeight = (stateIds.length - 1) * nodeSpacingY;
    const layerStartY = startY - totalHeight / 2;

    stateIds.forEach((id, idx) => {
      positions[id] = {
        x,
        y: Math.max(40, layerStartY + idx * nodeSpacingY),
      };
    });
  }

  return positions;
}
