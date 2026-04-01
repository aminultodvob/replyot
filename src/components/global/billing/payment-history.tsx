import type { PaymentHistoryItem } from "@/types/dashboard";

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return "N/A";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount: string, currency: string) => `${currency} ${amount}`;

const formatStatus = (status: PaymentHistoryItem["status"]) => {
  const labelMap = {
    PENDING: "Payment pending",
    PAID: "Paid",
    FAILED: "Payment failed",
    CANCELED: "Canceled",
    REFUNDED: "Refunded",
  } as const;

  return labelMap[status] ?? status;
};

const getStatusTone = (status: PaymentHistoryItem["status"]) => {
  if (status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "REFUNDED") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
};

type Props = {
  paymentHistory: PaymentHistoryItem[];
};

const PaymentHistory = ({ paymentHistory }: Props) => {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Payment history
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Billing history starts from this release forward.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {paymentHistory.length > 0
            ? `${paymentHistory.length} payment${paymentHistory.length === 1 ? "" : "s"} recorded`
            : "No payments yet"}
        </p>
      </div>

      {paymentHistory.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {paymentHistory.map((item) => (
            <article
              key={item.id}
              className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {formatAmount(item.amount, item.currency)}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(
                        item.status
                      )}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                      {item.plan}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Invoice <span className="font-medium text-slate-800">{item.invoiceId}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Billing period{" "}
                    {item.billingPeriodStart && item.billingPeriodEnd
                      ? `${formatDate(item.billingPeriodStart)} to ${formatDate(
                          item.billingPeriodEnd
                        )}`
                      : "Not assigned yet"}
                  </p>
                </div>

                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:min-w-[280px] sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Created</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatDate(item.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Paid</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatDate(item.paidAt)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500">Reference</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {item.externalPaymentId ?? item.invoiceId}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <p className="text-base font-medium text-slate-900">No payments yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Free is active right now. Your payment history will appear here after the
            first Pro payment.
          </p>
        </div>
      )}
    </section>
  );
};

export default PaymentHistory;
