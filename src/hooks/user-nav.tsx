import { usePathname } from "next/navigation";

export const usePaths = () => {
  const pathname = usePathname();
  const path = pathname.split("/");
  const page = path[2] || "dashboard";
  return { page, pathname };
};
