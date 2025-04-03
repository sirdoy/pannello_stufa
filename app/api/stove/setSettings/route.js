import { API_KEY } from '@/lib/stoveApi';

export async function POST(request) {
  const { fanLevel, powerLevel } = await request.json();
  const url = `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json/SetSettings/${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fanLevel, powerLevel }),
  });
  const data = await res.json();
  return Response.json(data);
}
