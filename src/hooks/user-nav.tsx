import { usePathname } from "next/navigation";

export const usePaths = () => {
  const pathname = usePathname();
  const safePathname = pathname ?? "/dashboard";
  const path = safePathname.split("/");
  const page = path[2] || "dashboard";
  return { page, pathname: safePathname };
};
