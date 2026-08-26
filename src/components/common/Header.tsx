import { User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/community', label: 'Community' },
  { href: '/support', label: 'Support' },
];

export default function Header() {
  const { pathname } = useLocation();
  const { user, signOut, online } = useAuth();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2" aria-label="JackPass home">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-200 hover:after:w-full",
                  isActive(link.href) ? "text-primary after:w-full" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Online Status Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-muted-foreground">
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>

              <Link to="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative w-8 h-8 rounded-full overflow-hidden">
                    {user.user_metadata?.avatar && user.user_metadata.avatar !== 'https://placehold.co/128x128.png' ? (
                      <img
                        src={user.user_metadata.avatar}
                        alt={user.user_metadata.name || 'User'}
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <span className="sr-only">User Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
