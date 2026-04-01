import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex flex-1 items-center gap-x-3 overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5">
      <SearchIcon className="text-slate-400" size={18} />
      <Input
        placeholder="Search by name, email or status"
        className="h-auto flex-1 border-none bg-transparent px-0 text-sm text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
      />
    </div>
  );
}

export default Search;
