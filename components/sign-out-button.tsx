'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Props = {
  variant?: 'outline' | 'ghost';
  size?: 'default' | 'sm';
  label?: string;
};

export function SignOutButton({
  variant = 'outline',
  size = 'default',
  label = 'Sign out',
}: Props) {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }
  return (
    <Button
      variant={variant}
      size={size}
      onClick={signOut}
      className={variant === 'outline' ? 'w-full' : undefined}
    >
      {label}
    </Button>
  );
}
