export async function rpcCall<T>(url: string, body: string): Promise<T> {
  return fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (r) => r.json())
    .then((data) => data as T);
}
