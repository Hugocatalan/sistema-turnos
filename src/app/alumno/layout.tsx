import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AlumnoLayout } from '@/components/alumno/AlumnoLayout';

export default async function AlumnoLayoutPage({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.rol === 'ADMIN') {
    redirect('/admin');
  }

  return <AlumnoLayout user={session.user}>{children}</AlumnoLayout>;
}
