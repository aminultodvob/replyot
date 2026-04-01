import React from "react";

type Props = {
  comments: number;
  dms: number;
};

const MetricsCard = ({ comments, dms }: Props) => {
  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row lg:items-end">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="app-panel-muted flex w-full flex-col justify-between gap-y-16 rounded-[24px] p-5 lg:w-6/12"
        >
          {i === 1 ? (
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Comments</h2>
              <p className="text-sm text-slate-500">On your posts</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Direct Messages</h2>
              <p className="text-sm text-slate-500">On your account</p>
            </div>
          )}
          {i === 1 ? (
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">100%</h3>
              <p className="text-sm text-slate-500">
                {comments} out of {comments} comments replied
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">100%</h3>
              <p className="text-sm text-slate-500">
                {dms} out of {dms} DMs replied
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MetricsCard;
