import { z } from "zod";
import {
  updateAutomationChannel,
  createAutomations,
  deleteAutomation,
  deleteKeyword,
  saveKeyword,
  saveListener,
  savePosts,
  saveTrigger,
  updateAutomationName,
} from "@/actions/automations";
import { queryKeys } from "@/lib/query-keys";
import { useMutationData } from "./use-mutation-data";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useZodForm from "./use-zod-form";

export const useCreateAutomation = (id?: string) => {
  const { isPending, mutate } = useMutationData(
    ["create-automation"],
    () => createAutomations(id),
    {
      invalidate: [queryKeys.userAutomations()],
      successToast: "automation_create",
      errorToast: "automation_create",
    }
  );

  return { isPending, mutate };
};

export const useEditAutomation = (automationId: string) => {
  const [edit, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const enableEdit = useCallback(() => setEdit(true), []);
  const disableEdit = useCallback(() => setEdit(false), []);

  const { isPending, mutate } = useMutationData(
    ["update-automation"],
    (data: { name: string }) =>
      updateAutomationName(automationId, { name: data.name }),
    {
      onMutate: (client, variables: { name: string }) => {
        const previousAutomation = client.getQueryData(
          queryKeys.automation(automationId)
        );
        const previousAutomations = client.getQueryData(
          queryKeys.userAutomations()
        );

        client.setQueryData(queryKeys.automation(automationId), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  name: variables.name,
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === automationId
                    ? { ...automation, name: variables.name }
                    : automation
                ),
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(
              queryKeys.automation(automationId),
              previousAutomation
            );
            client.setQueryData(
              queryKeys.userAutomations(),
              previousAutomations
            );
          },
        };
      },
      onSuccess: disableEdit,
      onSuccessUpdate: (client, _data, variables: { name: string }) => {
        client.setQueryData(queryKeys.automation(automationId), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  name: variables.name,
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === automationId
                    ? { ...automation, name: variables.name }
                    : automation
                ),
              }
            : current
        );
      },
    }
  );

  useEffect(() => {
    function handleClickOutside(this: Document, event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node | null)
      ) {
        if (inputRef.current.value !== "") {
          mutate({ name: inputRef.current.value });
        } else {
          disableEdit();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [disableEdit, mutate]);

  return {
    edit,
    enableEdit,
    disableEdit,
    inputRef,
    isPending,
  };
};

export const useListener = (
  id: string,
  channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP" = "INSTAGRAM",
  initialValues?: {
    listener?: "MESSAGE" | string;
    prompt?: string;
    reply?: string | null;
  }
) => {
  const isFacebook = channel === "FACEBOOK_MESSENGER";
  const [listener, setListener] = useState<"MESSAGE" | null>(
    initialValues?.listener === "MESSAGE" ? "MESSAGE" : "MESSAGE"
  );

  const promptSchema = isFacebook
    ? z.object({
        prompt: z.string().optional(),
        reply: z.string().min(1),
      })
    : z.object({
        prompt: z.string().min(1),
        reply: z.string(),
      });

  const { isPending, mutate } = useMutationData(
    ["create-lister"],
    (data: { prompt: string; reply: string }) =>
      saveListener(
        id,
        listener || "MESSAGE",
        isFacebook ? data.reply : data.prompt,
        data.reply
      ),
    {
      onMutate: (client, variables: { prompt: string; reply: string }) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        const previousAutomations = client.getQueryData(
          queryKeys.userAutomations()
        );
        const nextListener = listener || "MESSAGE";

        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  listener: {
                    ...(current.data.listener ?? {}),
                    listener: nextListener,
                    prompt: variables.prompt,
                    commentReply: variables.reply,
                  },
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === id
                    ? {
                        ...automation,
                        listener: {
                          ...(automation.listener ?? {}),
                          listener: nextListener,
                          prompt: variables.prompt,
                          commentReply: variables.reply,
                        },
                      }
                    : automation
                ),
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
            client.setQueryData(
              queryKeys.userAutomations(),
              previousAutomations
            );
          },
        };
      },
      onSuccessUpdate: (client, _data, variables: { prompt: string; reply: string }) => {
        const nextListener = listener || "MESSAGE";
        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  listener: {
                    ...(current.data.listener ?? {}),
                    listener: nextListener,
                    prompt: variables.prompt,
                    commentReply: variables.reply,
                  },
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === id
                    ? {
                        ...automation,
                        listener: {
                          ...(automation.listener ?? {}),
                          listener: nextListener,
                          prompt: variables.prompt,
                          commentReply: variables.reply,
                        },
                      }
                    : automation
                ),
              }
            : current
        );
      },
      successToast: "response_save",
      errorToast: "response_save",
    }
  );

  const { errors, onFormSubmit, register, reset, watch } = useZodForm(
    promptSchema,
    mutate,
    {
      prompt: initialValues?.prompt ?? "",
      reply: isFacebook
        ? initialValues?.reply ?? initialValues?.prompt ?? ""
        : initialValues?.reply ?? "",
    }
  );

  useEffect(() => {
    reset({
      prompt: initialValues?.prompt ?? "",
      reply: isFacebook
        ? initialValues?.reply ?? initialValues?.prompt ?? ""
        : initialValues?.reply ?? "",
    });
    setListener("MESSAGE");
  }, [
    initialValues?.listener,
    initialValues?.prompt,
    initialValues?.reply,
    isFacebook,
    reset,
  ]);

  const onSetListener = (type: "MESSAGE") => {
    setListener(type);
  };
  return { onSetListener, register, onFormSubmit, listener, isPending };
};

export const useDeleteAutomation = (
  onDeleteSuccess?: (automationId: string) => void
) => {
  const { mutate, isPending } = useMutationData(
    ["delete-automation"],
    (data: { automationId: string }) => deleteAutomation(data.automationId),
    {
      onMutate: (client, variables: { automationId: string }) => {
        const previousAutomations = client.getQueryData(
          queryKeys.userAutomations()
        );
        const previousAutomation = client.getQueryData(
          queryKeys.automation(variables.automationId)
        );

        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.filter(
                  (automation: any) => automation.id !== variables.automationId
                ),
              }
            : current
        );
        client.removeQueries({ queryKey: queryKeys.automation(variables.automationId) });

        return {
          rollback: () => {
            client.setQueryData(
              queryKeys.userAutomations(),
              previousAutomations
            );
            if (previousAutomation) {
              client.setQueryData(
                queryKeys.automation(variables.automationId),
                previousAutomation
              );
            }
          },
        };
      },
      invalidate: [queryKeys.userAutomations()],
      onSuccess: (data, variables: { automationId: string }) => {
        if (data?.status === 200) {
          onDeleteSuccess?.(variables.automationId);
        }
      },
    }
  );

  return { mutate, isPending };
};

export const useTriggers = (
  id: string,
  initialChannel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP" = "INSTAGRAM",
  initialTypes: string[] = [],
  options?: {
    autoSave?: boolean;
    canSetChannel?: (
      channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP"
    ) => boolean;
    canSetTrigger?: (type: "COMMENT" | "DM") => boolean;
  }
) => {
  const initialTypesSignature = useMemo(
    () => initialTypes.join("|"),
    [initialTypes]
  );
  const stableInitialTypes = useMemo(
    () => (initialTypesSignature ? initialTypesSignature.split("|") : []),
    [initialTypesSignature]
  );
  const [types, setTypes] = useState<string[]>(initialTypes);
  const [channel, setChannel] = useState<
    "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP"
  >(
    initialChannel
  );

  useEffect(() => {
    setChannel(initialChannel);
    setTypes(stableInitialTypes);
  }, [initialChannel, stableInitialTypes]);

  const { mutate: mutateChannel, isPending: channelPending } = useMutationData(
    ["update-automation-channel"],
    (data: { channel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP" }) =>
      updateAutomationChannel(id, data.channel),
    {
      onMutate: (client, variables) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        const previousAutomations = client.getQueryData(
          queryKeys.userAutomations()
        );

        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  channel: variables.channel,
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === id
                    ? { ...automation, channel: variables.channel }
                    : automation
                ),
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
            client.setQueryData(
              queryKeys.userAutomations(),
              previousAutomations
            );
          },
        };
      },
      onSuccessUpdate: () => {
        setTypes((current) =>
          channel === "FACEBOOK_MESSENGER"
            ? current.filter((item) => item === "COMMENT")
            : channel === "WHATSAPP"
              ? current.filter((item) => item === "DM")
            : current
        );
      },
      silentSuccess: true,
      silentError: true,
    }
  );

  const { isPending, mutate } = useMutationData(
    ["add-trigger"],
    (data: { types: string[] }) => saveTrigger(id, data.types),
    {
      onMutate: (client, variables: { types: string[] }) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  trigger: variables.types.map((type) => {
                    const existingTrigger = current.data.trigger.find(
                      (item: { type: string }) => item.type === type
                    );

                    return (
                      existingTrigger ?? {
                        id: `temp-${type.toLowerCase()}`,
                        type,
                      }
                    );
                  }),
                },
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
          },
        };
      },
      invalidate: [queryKeys.automation(id), queryKeys.userAutomations()],
      silentSuccess: true,
      silentError: true,
    }
  );

  const persistTypes = useCallback(
    (nextTypes: string[]) => mutate({ types: nextTypes }),
    [mutate]
  );

  const onSetChannel = (
    nextChannel: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP"
  ) => {
    if (options?.canSetChannel && !options.canSetChannel(nextChannel)) {
      return;
    }

    const nextTypes =
      nextChannel === "FACEBOOK_MESSENGER"
        ? types.filter((item) => item === "COMMENT")
        : nextChannel === "WHATSAPP"
          ? types.filter((item) => item === "DM")
        : types;

    setChannel(nextChannel);
    setTypes(nextTypes);
    mutateChannel({ channel: nextChannel });

    if (
      options?.autoSave &&
      nextTypes.join("|") !== types.join("|")
    ) {
      persistTypes(nextTypes);
    }
  };

  const onSetTrigger = (type: "COMMENT" | "DM") => {
    if (options?.canSetTrigger && !options.canSetTrigger(type)) {
      return;
    }

    let nextTypes: string[] = [];

    setTypes((current) => {
      nextTypes = current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type];

      return nextTypes;
    });

    if (options?.autoSave) {
      persistTypes(nextTypes);
    }
  };

  const onSaveTrigger = () => persistTypes(types);
  return {
    types,
    channel,
    onSetChannel,
    onSetTrigger,
    onSaveTrigger,
    isPending,
    channelPending,
  };
};

export const useKeywords = (id: string) => {
  const [keyword, setKeyword] = useState("");
  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setKeyword(e.target.value);

  const { mutate } = useMutationData(
    ["add-keyword"],
    (data: { keyword: string }) => saveKeyword(id, data.keyword),
    {
      onMutate: (client, variables: { keyword: string }) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        const previousAutomations = client.getQueryData(
          queryKeys.userAutomations()
        );
        const optimisticKeyword = {
          id: `temp-${Date.now()}`,
          word: variables.keyword,
        };

        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  keywords: [...current.data.keywords, optimisticKeyword],
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === id
                    ? {
                        ...automation,
                        keywords: [...automation.keywords, optimisticKeyword],
                      }
                    : automation
                ),
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
            client.setQueryData(
              queryKeys.userAutomations(),
              previousAutomations
            );
          },
        };
      },
      onSuccess: () => setKeyword(""),
      invalidate: [queryKeys.automation(id), queryKeys.userAutomations()],
      silentSuccess: true,
      silentError: true,
    }
  );

  const submitKeyword = useCallback(
    (value?: string) => {
      const trimmedKeyword = (value ?? keyword).trim();

      if (!trimmedKeyword) {
        return false;
      }

      mutate({ keyword: trimmedKeyword });
      setKeyword("");
      return true;
    },
    [keyword, mutate]
  );

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submitKeyword();
    }
  };

  const { mutate: deleteMutation } = useMutationData(
    ["delete-keyword"],
    (data: { id: string }) => deleteKeyword(data.id),
    {
      onMutate: (client, variables: { id: string }) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        const previousAutomations = client.getQueryData(
          queryKeys.userAutomations()
        );
        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  keywords: current.data.keywords.filter(
                    (word: { id: string }) => word.id !== variables.id
                  ),
                },
              }
            : current
        );
        client.setQueryData(queryKeys.userAutomations(), (current: any) =>
          current?.data
            ? {
                ...current,
                data: current.data.map((automation: any) =>
                  automation.id === id
                    ? {
                        ...automation,
                        keywords: automation.keywords.filter(
                          (word: { id: string }) => word.id !== variables.id
                        ),
                      }
                    : automation
                ),
              }
            : current
        );
        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
            client.setQueryData(
              queryKeys.userAutomations(),
              previousAutomations
            );
          },
        };
      },
      invalidate: [queryKeys.userAutomations()],
      silentSuccess: true,
      silentError: true,
    }
  );

  return {
    keyword,
    onValueChange,
    onKeyPress,
    deleteMutation,
    submitKeyword,
  };
};

type AutomationPostDraft = {
  postid: string;
  caption?: string;
  media: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
};

export const useAutomationPosts = (
  id: string,
  initialPosts: AutomationPostDraft[] = []
) => {
  const initialPostsSignature = initialPosts
    .map((post) => `${post.postid}:${post.media}:${post.mediaType}:${post.caption ?? ""}`)
    .join("|");
  const lastInitialPostsSignature = useRef(initialPostsSignature);
  const [posts, setPosts] = useState<AutomationPostDraft[]>(initialPosts);

  useEffect(() => {
    if (lastInitialPostsSignature.current !== initialPostsSignature) {
      lastInitialPostsSignature.current = initialPostsSignature;
      setPosts(initialPosts);
    }
  }, [initialPosts, initialPostsSignature]);

  const onSelectPost = (post: AutomationPostDraft) => {
    setPosts((prevItems) => {
      if (prevItems.find((p) => p.postid === post.postid)) {
        return prevItems.filter((item) => item.postid !== post.postid);
      } else {
        return [...prevItems, post];
      }
    });
  };

  const addManualPost = (postId: string) => {
    const trimmedPostId = postId.trim();

    if (!trimmedPostId) {
      return false;
    }

    let wasAdded = false;

    setPosts((prevItems) => {
      if (prevItems.find((post) => post.postid === trimmedPostId)) {
        return prevItems;
      }

      wasAdded = true;

      return [
        ...prevItems,
        {
          postid: trimmedPostId,
          caption: "Facebook post",
          media: "",
          mediaType: "IMAGE",
        },
      ];
    });

    return wasAdded;
  };

  const removeSelectedPost = (postId: string) => {
    setPosts((prevItems) =>
      prevItems.filter((post) => post.postid !== postId)
    );
  };

  const { mutate, isPending } = useMutationData(
    ["attach-posts"],
    () => savePosts(id, posts),
    {
      onMutate: (client) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  posts,
                },
              }
            : current
        );

        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
          },
        };
      },
      invalidate: [queryKeys.automation(id)],
      silentSuccess: true,
      silentError: true,
    }
  );
  return {
    posts,
    onSelectPost,
    addManualPost,
    removeSelectedPost,
    mutate,
    isPending,
  };
};
