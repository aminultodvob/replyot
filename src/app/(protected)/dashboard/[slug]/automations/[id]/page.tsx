import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

const Page = async ({ params }: Props) => {
  redirect(`/dashboard/automations/${params.id}`);
};

export default Page;
