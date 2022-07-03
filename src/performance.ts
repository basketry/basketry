import { PerformanceEntry, PerformanceObserver } from 'perf_hooks';

const performanceEntries: PerformanceEntry[] = [];
let performanceObserver: PerformanceObserver;

let finish: ((entries: PerformanceEntry[]) => void) | undefined;

export function track() {
  performanceObserver = new PerformanceObserver((items, observer) => {
    performanceEntries.push(...items.getEntries());

    if (finish) {
      observer.disconnect();
      finish(performanceEntries);
    }
  });
  performanceObserver.observe({ type: 'measure' });
}

export function drain(): Promise<PerformanceEntry[]> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      finish = undefined;
      resolve(performanceEntries);
    }, 100);

    finish = (entries) => {
      clearTimeout(timeout);
      finish = undefined;
      resolve(entries);
    };
  });
}
