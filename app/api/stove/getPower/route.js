import { STUFA_API } from '@/lib/stoveApi';

export async function GET() {
  const res = await fetch(STUFA_API.getPower);
  const data = await res.json();
  return Response.json(data);
}
