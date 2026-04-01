import { useAutomationPosts } from "@/hooks/use-automations";
import { useQueryAutomationPosts } from "@/hooks/user-queries";
import React from "react";
import TriggerButton from "../trigger-button";
import { InstagramPostProps } from "@/types/posts.type";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Loader from "../../loader";
import DashboardLink from "../../dashboard/link";
import { Skeleton } from "@/components/ui/skeleton";
import InlineStatus from "../../inline-status";
import { useMutationDataState } from "@/hooks/use-mutation-data";

type Props = {
  id: string;
  channel?: "INSTAGRAM" | "FACEBOOK_MESSENGER";
  label?: string;
  initialPosts?: {
    postid: string;
    caption?: string | null;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[];
};

const PostMediaPreview = ({
  mediaUrl,
  mediaType,
  className,
}: {
  mediaUrl: string;
  mediaType: InstagramPostProps["media_type"];
  className?: string;
}) => {
  if (!mediaUrl) {
    return <div className={cn("h-full w-full bg-slate-100", className)} />;
  }

  if (mediaType === "VIDEO") {
    return (
      <video
        className={cn("h-full w-full object-cover", className)}
        muted
        playsInline
        preload="metadata"
        src={mediaUrl}
      />
    );
  }

  return (
    <Image
      unoptimized
      fill
      sizes="100vw"
      src={mediaUrl}
      alt="post preview"
      className={cn("object-cover", className)}
    />
  );
};

const PostButton = ({
  id,
  channel = "INSTAGRAM",
  label,
  initialPosts = [],
}: Props) => {
  const isFacebook = channel === "FACEBOOK_MESSENGER";
  const integrationsHref = "/dashboard/integrations";

  const [open, setOpen] = React.useState(false);
  const { data } = useQueryAutomationPosts(open, channel);
  const {
    posts,
    onSelectPost,
    mutate,
    isPending,
  } = useAutomationPosts(
    id,
    initialPosts.map((post) => ({
      postid: post.postid,
      caption: post.caption ?? undefined,
      media: post.media,
      mediaType: post.mediaType,
    }))
  );
  const { latestVariable } = useMutationDataState(["attach-posts"]);

  const successBody =
    data?.status === 200 && data.data && typeof data.data === "object" && "data" in data.data
      ? (data.data as { data: unknown }).data
      : null;
  const mediaList = Array.isArray(successBody) ? (successBody as InstagramPostProps[]) : null;

  const errorPayload =
    data && data.status !== 200 && data.data && typeof data.data === "object"
      ? (data.data as { message?: string; needsReconnect?: boolean })
      : null;

  const emptyMessage = isFacebook
    ? "No Facebook posts found for this Page yet."
    : "No posts found!";

  return (
    <TriggerButton
      label={label ?? (isFacebook ? "Attach Facebook posts" : "Attach a post")}
      open={open}
      onOpenChange={setOpen}
    >
      {open && !data ? (
        <div className="flex flex-col gap-y-3 w-full">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : mediaList && mediaList.length > 0 ? (
        <div className="flex flex-col gap-y-3 w-full">
          {isFacebook ? (
            <p className="text-xs text-slate-500">
              Select specific Facebook posts. Only comments on selected posts will trigger this automation.
            </p>
          ) : null}
          <div className="flex flex-wrap w-full gap-3">
            {mediaList.map((post: InstagramPostProps) => (
              <div
                className="relative w-4/12 aspect-square rounded-lg cursor-pointer overflow-hidden"
                key={post.id}
                onClick={() =>
                  onSelectPost({
                    postid: post.id,
                    media: post.media_url,
                    mediaType: post.media_type,
                    caption: post.caption,
                  })
                }
                >
                {posts.find((p) => p.postid === post.id) && (
                  <CheckCircle
                    fill="white"
                    stroke="black"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                  />
                )}
                <PostMediaPreview
                  mediaUrl={post.media_url}
                  mediaType={post.media_type}
                  className={cn(
                    "hover:opacity-75 transition duration-100",
                    posts.find((p) => p.postid === post.id) && "opacity-75",
                  )}
                />
                {!post.media_url ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-2 text-center text-[11px] font-medium text-slate-600">
                    {post.caption ? post.caption.slice(0, 80) : "Facebook post"}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <Button
            onClick={() =>
              mutate(undefined, {
                onSuccess: () => setOpen(false),
              })
            }
            disabled={posts.length === 0}
            className="bg-gradient-to-br w-full from-[#3352CC] font-medium text-white to-[#1C2D70]"
          >
            <Loader state={isPending}>
              {isFacebook ? "Save Facebook Posts" : "Save Posts"}
            </Loader>
          </Button>
          <InlineStatus
            status={
              latestVariable?.status === "pending"
                ? "pending"
                : latestVariable?.status === "success"
                  ? "success"
                  : latestVariable?.status === "error"
                    ? "error"
                    : "idle"
            }
            pendingLabel="Attaching selected posts..."
            successLabel="Posts attached"
            errorLabel="Attach failed"
          />
        </div>
      ) : mediaList && mediaList.length === 0 ? (
        <p className="text-text-secondary text-center">{emptyMessage}</p>
      ) : data?.status === 401 || errorPayload?.needsReconnect ? (
        <div className="flex flex-col gap-2 text-center text-text-secondary text-sm">
          <p>
            {isFacebook
              ? "Your Facebook page token expired or was revoked. Reconnect in Integrations to attach posts."
              : "Your Instagram session expired or was revoked. Reconnect in Integrations to attach posts."}
          </p>
          <Button
            asChild
            className="bg-gradient-to-br w-full from-[#3352CC] font-medium text-white to-[#1C2D70]"
          >
            <DashboardLink href={integrationsHref}>
              Open Integrations
            </DashboardLink>
          </Button>
        </div>
      ) : data?.status === 404 ? (
        <div className="flex flex-col gap-2 text-center text-text-secondary text-sm">
          <p>{errorPayload?.message ?? "Connect Instagram first."}</p>
          <Button
            asChild
            className="bg-gradient-to-br w-full from-[#3352CC] font-medium text-white to-[#1C2D70]"
          >
            <DashboardLink href={integrationsHref}>
              Open Integrations
            </DashboardLink>
          </Button>
        </div>
      ) : (
        <p className="text-text-secondary text-center">
          {errorPayload?.message ?? "No posts found!"}
        </p>
      )}
    </TriggerButton>
  );
};

export default PostButton;
