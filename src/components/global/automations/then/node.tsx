"use client";
import { Separator } from "@/components/ui/separator";
import { Message, PlaneBlue, Warning } from "@/icons";
import { AutomationDetail } from "@/types/dashboard";
import React from "react";
import PostButton from "../post";
import ThenAction from "./then-action";

type Props = {
  id: string;
  automation: AutomationDetail;
};

const ThenNode = ({ id, automation }: Props) => {
  const commentTrigger = automation.trigger.find((t) => t.type === "COMMENT");

  return !automation.listener ? (
    <></>
  ) : (
    <div className="app-panel relative flex w-full flex-col gap-y-4 rounded-[28px] p-6 lg:w-10/12 xl:w-7/12">
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
        Then...
      </div>
      <div className="app-panel-muted flex flex-col gap-y-2 rounded-[22px] p-4">
        <div className="flex gap-x-2 items-center">
          {automation.listener.listener === "MESSAGE" ? (
            automation.channel === "FACEBOOK_MESSENGER" ? <Message /> : <PlaneBlue />
          ) : null}
          <p className="text-lg font-semibold tracking-tight text-slate-950">
            {automation.channel === "FACEBOOK_MESSENGER"
              ? "Send a public reply after a Facebook comment match."
              : automation.channel === "WHATSAPP"
                ? "Send a WhatsApp reply after a keyword match."
              : "Send the user a message."}
          </p>
        </div>
        <p className="flont-light text-sm leading-6 text-slate-500">
          {automation.channel === "FACEBOOK_MESSENGER"
            ? `Public reply: ${
                automation.listener.commentReply ?? automation.listener.prompt ?? "Not set"
              }`
            : automation.channel === "WHATSAPP"
              ? `WhatsApp reply: ${automation.listener.prompt ?? "Not set"}`
            : automation.listener.prompt}
        </p>
      </div>
      <ThenAction
        id={id}
        channel={automation.channel}
        label="Edit listener"
        submitLabel="Update listener"
        initialValues={{
          listener: automation.listener.listener,
          prompt: automation.listener.prompt,
          reply: automation.listener.commentReply,
        }}
      />
      {automation.posts.length > 0 ? (
        <></>
      ) : commentTrigger ? (
        <PostButton id={id} channel={automation.channel} />
      ) : (
        <></>
      )}
    </div>
  );
};

export default ThenNode;
