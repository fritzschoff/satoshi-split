import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (globalThis as typeof globalThis).Buffer = Buffer;
}
