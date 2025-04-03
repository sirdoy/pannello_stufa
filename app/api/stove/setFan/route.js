import { STUFA_API } from '@/lib/stoveApi';

export async function POST(req) {
  const { level } = await req.json();
  const res = await fetch(STUFA_API.setFan(level));
  const data = await res.json();
  return Response.json(data);
}
