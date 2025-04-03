import { API_KEY } from '@/lib/stoveApi';

export async function GET() {
  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/GetStatus/${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return Response.json(data);
}
