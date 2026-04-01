import { redirect } from "next/navigation";

type Props = {
  searchParams?: {
    integration_error?: string;
    integration_notice?: string;
  };
};

const Page = async ({ searchParams }: Props) => {
  const query = new URLSearchParams();

  if (searchParams?.integration_error) {
    query.set("integration_error", searchParams.integration_error);
  }

  if (searchParams?.integration_notice) {
    query.set("integration_notice", searchParams.integration_notice);
  }

  redirect(
    query.toString()
      ? `/dashboard/integrations?${query.toString()}`
      : "/dashboard/integrations"
  );
};

export default Page;
