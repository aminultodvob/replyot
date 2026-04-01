import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { CreditCardIcon, Loader2 } from "lucide-react";
import React from "react";

type Props = {};

const PaymentButton = (props: Props) => {
  const { onSubscribe, isProcessing } = useSubscription();
  return (
    <Button
      disabled={isProcessing}
      onClick={onSubscribe}
      className="rounded-2xl bg-[#1a73e8] font-semibold text-white hover:bg-[#1765cc]"
    >
      {isProcessing ? <Loader2 className="animate-spin" /> : <CreditCardIcon />}
      Continue Setup
    </Button>
  );
};

export default PaymentButton;
