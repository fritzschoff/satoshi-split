import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    ethereum?: any;
  }

  var Buffer: typeof Buffer;
}

export {};
