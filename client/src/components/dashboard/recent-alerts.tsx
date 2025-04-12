import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Alert } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type RecentAlertsProps = {
  alerts: Alert[];
};

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  const markAsRead = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/alerts/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });
  
  const handleMarkAsRead = (id: number) => {
    markAsRead.mutate(id);
  };
  
  // Get the icon based on alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  // Get the background color based on alert type
  const getAlertBackground = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500 bg-opacity-10";
      case "warning":
        return "bg-yellow-500 bg-opacity-10";
      case "success":
        return "bg-green-500 bg-opacity-10";
      default:
        return "bg-blue-500 bg-opacity-10";
    }
  };
  
  // Get the icon background color based on alert type
  const getIconBackground = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-heading font-semibold mb-6">Recent Alerts</h2>
      
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center text-neutral-500 py-4">
            No alerts at the moment
          </div>
        ) : (
          alerts.slice(0, 3).map((alert) => (
            <div 
              key={alert.id} 
              className={`flex items-start p-3 rounded-lg ${getAlertBackground(alert.type)}`}
            >
              <div className={`${getIconBackground(alert.type)} rounded-full p-1.5 text-white mr-3 mt-0.5 flex-shrink-0`}>
                {getAlertIcon(alert.type)}
              </div>
              <div>
                <h4 className="text-sm font-medium">{alert.title}</h4>
                <p className="text-xs text-neutral-500 mt-1">{alert.message}</p>
                <div className="mt-2 text-xs">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary font-medium"
                    onClick={() => handleMarkAsRead(alert.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {alerts.length > 3 && (
        <Button 
          variant="ghost" 
          className="mt-4 text-sm text-primary font-medium flex items-center w-full justify-center"
        >
          View all alerts
        </Button>
      )}
    </div>
  );
}
