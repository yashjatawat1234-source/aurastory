const SUPABASE_TARGET_URL = "https://yhbhgvrwuhxtebvqxggi.supabase.co";

export default async function handler(request: Request) {
  const url = new URL(request.url);
  
  // Extract path and query parameters
  const targetUrl = new URL(SUPABASE_TARGET_URL);
  targetUrl.pathname = url.pathname;
  targetUrl.search = url.search;

  // Prepare clean headers for upstream request
  const headers = new Headers(request.headers);
  headers.set("Host", targetUrl.hostname);
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: headers,
    body: body,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}