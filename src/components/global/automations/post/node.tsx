"use client";
import { Separator } from "@/components/ui/separator";
import { InstagramBlue, Warning } from "@/icons";
import { AutomationDetail } from "@/types/dashboard";
import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";
import PostButton from ".";

type Props = {
  automation: AutomationDetail;
};

const PostNode = ({ automation }: Props) => {
  const isInstagram = automation.channel === "INSTAGRAM";

  return (
    automation.posts.length > 0 && (
      <div className="app-panel relative flex w-full flex-col gap-y-4 rounded-[28px] p-6 lg:w-8/12 xl:w-5/12">
        <div className="absolute h-20 left-1/2 bottom-full flex flex-col items-center z-50">
          <span className="h-[9px] w-[9px] bg-connector/10 rounded-full" />
          <Separator
            orientation="vertical"
            className="bottom-full flex-1 border-[1px] border-connector/10"
          />
          <span className="h-[9px] w-[9px] bg-connector/10 rounded-full" />
        </div>
        <div className="flex gap-x-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          <Warning />
          If they comment on...
        </div>
        <div className="app-panel-muted flex flex-col gap-y-2 rounded-[22px] p-4">
          <div className="flex gap-x-2 items-center">
            <InstagramBlue />
            <p className="text-lg font-semibold tracking-tight text-slate-950">
              {isInstagram ? "These posts" : "Attached Facebook posts"}
            </p>
          </div>
          {isInstagram ? (
            <div className="flex gap-x-2 flex-wrap mt-3">
              {automation.posts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square w-[calc(33.333%-0.34rem)] cursor-pointer overflow-hidden rounded-lg"
                >
                  {post.mediaType === "VIDEO" ? (
                    <video
                      className={cn("h-full w-full object-cover")}
                      muted
                      playsInline
                      preload="metadata"
                      src={post.media}
                    />
                  ) : (
                    <Image
                      fill
                      sizes="100vw"
                      src={post.media}
                      alt="post image"
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {automation.posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                >
                  <span className="font-medium text-slate-950">Post ID:</span> {post.postid}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3">
            <PostButton
              id={automation.id}
              channel={automation.channel}
              label={isInstagram ? "Edit selected posts" : "Edit attached Facebook posts"}
              initialPosts={automation.posts}
            />
          </div>
        </div>
      </div>
    )
  );
};

export default PostNode;
