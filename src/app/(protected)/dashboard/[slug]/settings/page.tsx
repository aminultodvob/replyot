import { redirect } from "next/navigation";

const Page = async () => {
  redirect("/dashboard/settings");
};

export default Page;
