import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export const Notifications = () => {
  return (
    <Button variant="outline" className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50">
      <Bell color="currentColor" />
    </Button>
  );
};
