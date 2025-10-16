// Polyfills for Node.js APIs in the browser
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (globalThis as any).Buffer = Buffer;
}
