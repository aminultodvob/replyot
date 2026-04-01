import { Comment, Message, PlaneBlue } from "@/icons";
import React from "react";

type Props = {
  type: string;
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER";
  keywords: {
    id: string;
    word: string;
    automationId: string | null;
  }[];
};

function ActiveTrigger({ keywords, type, channel }: Props) {
  const isFacebook = channel === "FACEBOOK_MESSENGER";
  const isLegacyFacebookDm = isFacebook && type !== "COMMENT";

  const title = isLegacyFacebookDm
    ? "Legacy Facebook direct message trigger"
    : type === "COMMENT"
      ? isFacebook
        ? "Comments on selected Facebook posts"
        : "Comments on selected Instagram posts"
      : "Direct messages";

  const description = isLegacyFacebookDm
    ? "This workflow was created before Facebook became comment-only. Update the trigger to Comment if you want this automation to run again."
    : type === "COMMENT"
      ? isFacebook
        ? "This automation runs when a matching keyword appears on one of the Facebook posts attached to this workflow."
        : "This automation runs when a matching keyword appears on one of the Instagram posts attached to this workflow."
      : "This automation runs when a direct message matches one of your saved keywords.";

  return (
    <div className="app-panel-muted w-full rounded-[24px] p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isLegacyFacebookDm
                ? "bg-amber-50 text-amber-700"
                : "bg-white text-slate-700"
            }`}
          >
            {type === "COMMENT" ? (
              <Comment />
            ) : isFacebook ? (
              <Message />
            ) : (
              <PlaneBlue />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                {title}
              </p>
              {isLegacyFacebookDm ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Legacy setup
                </span>
              ) : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        {keywords.length > 0 ? (
          <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Current keywords
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.map((word) => (
                <div
                  key={word.id}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-700"
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ActiveTrigger;
