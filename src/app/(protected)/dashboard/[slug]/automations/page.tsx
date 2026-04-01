import { redirect } from "next/navigation";

const Page = async () => {
  redirect("/dashboard/automations");
};

export default Page;
