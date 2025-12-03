// app/api/user/route.js (Next.js App Router)
import { auth0 } from '@/lib/auth0';

export async function GET(request) {
  const session = await auth0.getSession(request);
  if (!session || !session.user) {
    return Response.json({ user: null });
  }
  return Response.json({ user: session.user });
}
