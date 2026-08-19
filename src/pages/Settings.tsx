import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Palette,
  Bell,
  Lock,
  FileCog,
  ShieldQuestion,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { institutions } from '@/lib/data';

const settingsNav = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  { id: 'app', label: 'App Settings', icon: FileCog },
  { id: 'support', label: 'Support & About', icon: ShieldQuestion },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [defaultUniversity, setDefaultUniversity] = useState('');

  const institutionOptions = institutions.map(inst => ({
    value: inst.name.toLowerCase(),
    label: inst.name,
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account details and security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Email Address</h3>
                  <p className="text-sm text-muted-foreground">user@example.com</p>
                </div>
                <Button variant="outline">Change Email</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Keep your account extra secure.</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              <div className="p-4 border rounded-lg border-destructive/50">
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <Button variant="destructive">Delete My Account</Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'preferences':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience on JackPass.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <h3 className="font-medium">Theme</h3>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Default University</h3>
                  <p className="text-sm text-muted-foreground">Searches will start from your school.</p>
                </div>
                <Combobox
                  options={institutionOptions}
                  placeholder="Select your university"
                  searchPlaceholder="Search universities..."
                  value={defaultUniversity}
                  onSelect={setDefaultUniversity}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <h3 className="font-medium">Language</h3>
                <Select>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pi">Pidgin</SelectItem>
                    <SelectItem value="yo">Yoruba</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                    <SelectItem value="ig">Igbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications from us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Get emails about your account, new features, and updates.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">For new uploads in your selected courses or university.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Forum Notifications</h3>
                  <p className="text-sm text-muted-foreground">Get notified for replies and mentions in the community forum.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        );
      case 'privacy':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Control your privacy and manage your security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Manage Connected Devices</h3>
                  <p className="text-sm text-muted-foreground">Log out of sessions on other devices.</p>
                </div>
                <Button variant="outline">Manage Sessions</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Request Data Download</h3>
                  <p className="text-sm text-muted-foreground">Get a copy of all your data stored on JackPass.</p>
                </div>
                <Button variant="outline">Request Download</Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'app':
        return (
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
              <CardDescription>Configure the app's behavior to your liking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Embedded Scanner</h3>
                  <p className="text-sm text-muted-foreground">Enable or disable the in-app document scanner during upload.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Default Sort for Questions</h3>
                  <p className="text-sm text-muted-foreground">Choose how past questions are sorted by default.</p>
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="By Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">By Year</SelectItem>
                    <SelectItem value="faculty">By Faculty</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );
      case 'support':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Support & About</CardTitle>
              <CardDescription>Get help and learn more about JackPass.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/support#faq" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"><span>Frequently Asked Questions</span><ChevronRight /></Link>
              <Link to="/support" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"><span>Contact Support</span><ChevronRight /></Link>
              <Link to="#" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"><span>Terms & Conditions</span><ChevronRight /></Link>
              <Link to="#" className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"><span>Privacy Policy</span><ChevronRight /></Link>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <header className="relative overflow-hidden rounded-3xl px-6 py-10 mb-8">
        <div aria-hidden className="absolute inset-0 bg-adire text-primary/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="relative">
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and app preferences.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <aside className="md:col-span-3">
          <nav className="flex flex-col gap-2">
            {settingsNav.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>
        <main className="md:col-span-9">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
