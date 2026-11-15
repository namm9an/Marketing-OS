export async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  let data;
  try { data = await response.json(); } catch {
    throw new Error('The API returned an unreadable response. Check the server connection.');
  }
  if (!response.ok || data?.error) {
    const error = new Error(data?.message || data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
