// app/api/user/route.js (Next.js App Router)
import { getSession } from '@auth0/nextjs-auth0';

export async function GET() {
  const session = await getSession();
  if (!session || !session.user) {
    return Response.json({ user: null });
  }
  return Response.json({ user: session.user });
}
