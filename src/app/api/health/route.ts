import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Endpoint de status para monitoramento, load balancer e Docker healthcheck.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'lumiardi-platform',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
