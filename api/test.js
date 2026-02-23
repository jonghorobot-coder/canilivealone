export const config = {
  runtime: 'edge',
};

export default function handler(request) {
  return new Response('API is working!', {
    headers: { 'Content-Type': 'text/plain' },
  });
}
