import { redirect } from 'next/navigation';

/**
 * Stove main page - redirects to homepage
 * The stove control card is displayed on the homepage
 */
export default function StovePage() {
  redirect('/');
}
