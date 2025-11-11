export function withCORS(res: Response) {
  const h = new Headers(res.headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Headers', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  return new Response(res.body, { status: res.status, headers: h })
}

export function json(data: unknown, status = 200) {
  return withCORS(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }))
}