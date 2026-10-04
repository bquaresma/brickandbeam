// Image conversion is CPU- and memory-heavy and the production task is small
// (see the roadmap's photo-pipeline spike), so only one runs at a time. Callers
// queue behind each other in order.
let tail: Promise<unknown> = Promise.resolve();

export function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = tail.then(task, task);
  tail = result.catch(() => undefined);
  return result;
}
