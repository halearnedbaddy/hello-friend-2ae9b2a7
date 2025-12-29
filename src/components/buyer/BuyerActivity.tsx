import { Activity, CheckCircle, AlertTriangle, DollarSign, ShoppingCart, Clock } from 'lucide-react';

export function BuyerActivity() {
  const activities = [
    {
      id: 1,
      type: 'order',
      action: 'Order Placed',
      description: 'You purchased iPhone 13 Pro from Tech Haven',
      amount: 'KES 85,000',
      time: '2 hours ago',
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 2,
      type: 'delivery',
      action: 'Delivery Confirmed',
      description: 'Item received from Samsung World',
      amount: 'KES 45,000',
      time: '1 day ago',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 3,
      type: 'payment',
      action: 'Escrow Released',
      description: 'Payment released to Glamour Trends',
      amount: 'KES 12,500',
      time: '3 days ago',
      icon: DollarSign,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: 4,
      type: 'pending',
      action: 'Payment Pending',
      description: 'Waiting for seller confirmation',
      amount: 'KES 28,000',
      time: '5 days ago',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600'
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Activity Timeline</h2>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${activity.color}`}>
                  <Icon size={24} />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{activity.action}</h3>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <span className="text-sm font-bold text-gray-900">{activity.amount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
