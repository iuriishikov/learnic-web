/**
 * Test-only route: returns an upstream image after a configurable delay.
 * Used by `/[locale]/test-user-avatar` to demonstrate the Skeleton loading
 * state in `UserAvatar`. Not used by production code.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const delayMs = Math.min(
    Math.max(Number(url.searchParams.get('delay') ?? 3000), 0),
    10000,
  );

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const upstream = await fetch(
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=face',
  );

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'no-store',
    },
  });
}
