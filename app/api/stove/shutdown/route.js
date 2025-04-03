import { STUFA_API } from '@/lib/stoveApi';

export async function POST() {
  const res = await fetch(STUFA_API.shutdown);
  const data = await res.json();
  return Response.json(data);
}
