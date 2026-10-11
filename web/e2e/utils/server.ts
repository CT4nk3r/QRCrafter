import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface ImageServer {
  url: string;
  close: () => Promise<void>;
}

/**
 * A throwaway localhost server for the one thing page.route() cannot prove: CORS.
 * Playwright adds Access-Control-Allow-Origin to fulfilled responses itself, so a real
 * cross-origin server (different port) is needed to check the app's CORS requirement.
 */
export async function startImageServer(png: Buffer, withCors: boolean): Promise<ImageServer> {
  const server: Server = createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      ...(withCors ? { 'Access-Control-Allow-Origin': '*' } : {}),
    });
    res.end(png);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/qr.png`,
    close: () => new Promise<void>(resolve => server.close(() => resolve())),
  };
}
