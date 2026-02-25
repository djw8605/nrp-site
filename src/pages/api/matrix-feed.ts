// Simple proxy to bypass CORS
export const prerender = false;

export async function GET() {
  try {
    const response = await fetch('https://portal.nrp.ai/exportMatrixNews');
    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}