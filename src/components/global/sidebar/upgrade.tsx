import React from "react";
import PaymentButton from "../payment-button";

type Props = {};

const UpgradeCard = (props: Props) => {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <span className="text-sm font-medium text-slate-600">
        Need more than Free?{" "}
        <span className="font-semibold text-slate-950">
          Upgrade to Pro
        </span>
      </span>
      <p className="text-sm leading-6 text-slate-500">
        Unlock both channels, more automations, and higher delivery limits for the current billing cycle.
      </p>
      <PaymentButton />
    </div>
  );
};

export default UpgradeCard;
