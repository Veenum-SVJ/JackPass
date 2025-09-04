import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Billing</h1>
      <Card>
        <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
        <p>Your current plan: [Free/Premium]</p>
        <p>Next billing date: [Date]</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
        <p>Manage your saved payment methods here.</p>
        <button>Add Payment Method</button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
        <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
        <p>View your past invoices and transactions.</p>
        <ul>
        <li>Invoice #123 - [Date] - [Amount]</li>
        </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where billing and subscription information will be displayed.</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
        <CardTitle>Premium Features</CardTitle>
        </CardHeader>
        <CardContent>
        <p>Learn more about the benefits of a premium subscription.</p>
        </CardContent>
      </Card>
    </div>
  );
}
