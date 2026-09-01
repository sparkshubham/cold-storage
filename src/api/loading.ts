type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

export function trackApiLoading(delta: number) {
  pending = Math.max(0, pending + delta);
  listeners.forEach((listener) => listener(pending));
}

export function subscribeApiLoading(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}
