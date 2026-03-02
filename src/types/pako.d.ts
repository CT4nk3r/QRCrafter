declare module 'pako' {
  export function inflate(data: Uint8Array | Buffer): Uint8Array;
  export const version: string;
}
