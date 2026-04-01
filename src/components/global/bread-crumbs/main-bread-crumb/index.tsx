import { PAGE_ICON } from "@/constants/pages";
import React from "react";

type Props = {
  page: string;
};

const MainBreadCrumb = ({ page }: Props) => {
  if (page === "Home") {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-y-5">
      <span className="inline-flex items-center gap-x-3">
        {PAGE_ICON[page.toUpperCase()]}
        <h2 className="text-3xl font-semibold capitalize tracking-tight text-slate-950">
          {page}
        </h2>
      </span>
    </div>
  );
};

export default MainBreadCrumb;
