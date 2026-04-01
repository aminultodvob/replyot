import { UserPlan } from "@/types/dashboard";

type Props = {
  type: "FREE" | "PRO";
  currentPlan: UserPlan;
  children: React.ReactNode;
};

export const SubscriptionPlan = ({ children, type, currentPlan }: Props) => {
  return currentPlan === type ? children : null;
};
