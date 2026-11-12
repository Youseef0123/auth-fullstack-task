import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export default function HomePage(): never {
  redirect(ROUTES.home);
}
