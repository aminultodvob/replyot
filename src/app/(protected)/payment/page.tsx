import { onSubscribe, onUserInfo } from "@/actions/user";
import { redirect } from "next/navigation";
import React from "react";
import { CancelPayment } from "@/components/payment/cancel-payment";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: {
    invoice_id?: string;
    cancel?: boolean;
  };
};

const Page = async ({ searchParams: { cancel, invoice_id } }: Props) => {
  if (invoice_id) {
    const customer = await onSubscribe(invoice_id);

    if (customer.status === 200) {
      return redirect("/dashboard/automations");
    }

    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center">
        <h4 className="text-5xl font-bold">Payment not confirmed</h4>
        <p className="max-w-md text-base text-slate-600">
          We could not verify this UddoktaPay invoice yet. If you were charged, the webhook may still unlock your package shortly.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (cancel) {
    return <CancelPayment />;
  }

  return redirect("/dashboard");
};

export default Page;
