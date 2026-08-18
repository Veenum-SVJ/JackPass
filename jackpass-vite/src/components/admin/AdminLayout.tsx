import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link to="/admin" className="font-headline font-bold text-lg hover:text-primary">
          Admin
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link to="/admin/questions" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            Moderation
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
