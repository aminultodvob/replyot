import { Input } from "@/components/ui/input";
import { useKeywords } from "@/hooks/use-automations";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { AutomationDetail } from "@/types/dashboard";
import { X } from "lucide-react";
import React from "react";
import InlineStatus from "../../inline-status";

type Props = {
  id: string;
  keywords: AutomationDetail["keywords"];
};

export const Keywords = ({ id, keywords }: Props) => {
  const { onValueChange, keyword, onKeyPress, deleteMutation } = useKeywords(id);
  const { latestVariable } = useMutationDataState(["add-keyword"]);
  const { latestVariable: latestDeleteVariable } =
    useMutationDataState(["delete-keyword"]);
  const pendingKeywordId = latestVariable?.variables?.id;

  const latestStatus =
    latestDeleteVariable?.status === "pending"
      ? "pending"
      : latestDeleteVariable?.status === "error"
        ? "error"
        : latestVariable?.status === "pending"
          ? "pending"
          : latestVariable?.status === "success" ||
              latestDeleteVariable?.status === "success"
            ? "success"
            : latestVariable?.status === "error"
              ? "error"
              : "idle";

  return (
    <div className="app-panel-muted flex flex-col gap-y-3 rounded-[24px] p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-800">Keywords</p>
        <p className="text-sm text-slate-500">
          Add the words that should activate this workflow.
        </p>
      </div>

      <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {keywords &&
            keywords.length > 0 &&
            keywords.map(
              (word) =>
                word.id !== pendingKeywordId && (
                  <div
                    className="flex items-center gap-x-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm capitalize text-slate-700"
                    key={word.id}
                  >
                    <p>{word.word}</p>
                    <button
                      type="button"
                      aria-label={`Delete keyword ${word.word}`}
                      onClick={() => deleteMutation({ id: word.id })}
                      className="text-slate-400 transition-colors hover:text-slate-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
            )}

          {latestVariable?.status === "pending" &&
          latestVariable?.variables?.keyword ? (
            <div className="flex items-center gap-x-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm capitalize text-slate-700">
              {latestVariable.variables.keyword}
            </div>
          ) : null}

          <Input
            placeholder="Add keyword..."
            style={{
              width: Math.min(Math.max(keyword.length || 12, 12), 50) + "ch",
            }}
            value={keyword}
            className="h-auto border-none bg-transparent p-0 text-sm text-slate-900 ring-0 outline-none placeholder:text-slate-400"
            onChange={onValueChange}
            onKeyUp={onKeyPress}
          />
        </div>
      </div>

      <InlineStatus
        status={latestStatus}
        pendingLabel="Updating keywords..."
        successLabel="Keywords synced"
        errorLabel="Keyword update failed"
      />
    </div>
  );
};

export default Keywords;
