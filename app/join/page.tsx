import { redirect } from 'next/navigation';

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const dest = ref ? `/register?ref=${encodeURIComponent(ref)}` : '/register';
  redirect(dest);
}
