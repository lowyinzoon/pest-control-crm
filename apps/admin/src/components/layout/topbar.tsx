'use client';

import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {user && (
          <div className="text-sm">
            <span className="font-medium">{user.fullName}</span>
            {user.branchName && (
              <span className="text-muted-foreground ml-2">({user.branchName})</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
