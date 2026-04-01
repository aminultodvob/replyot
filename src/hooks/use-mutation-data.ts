import {
  DefaultError,
  MutationFunction,
  MutationKey,
  QueryClient,
  QueryKey,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getToastConfig,
  normalizeAppError,
  type AppFeedbackContext,
} from "@/lib/feedback";

type MutationContext = {
  rollback?: () => void;
};

type MutationDataOptions = {
  invalidate?: QueryKey[];
  onSuccess?: (data: any, variables: any) => void;
  onMutate?: (
    client: QueryClient,
    variables: any
  ) => void | MutationContext | Promise<void | MutationContext>;
  onSuccessUpdate?: (client: QueryClient, data: any, variables: any) => void;
  onError?: (
    client: QueryClient,
    error: DefaultError,
    variables: any,
    context: MutationContext | undefined
  ) => void;
  successToast?:
    | false
    | AppFeedbackContext
    | {
        context: AppFeedbackContext;
        title?: string | ((data: any, variables: any) => string);
        description?: string | ((data: any, variables: any) => string | undefined);
      };
  errorToast?:
    | false
    | AppFeedbackContext
    | {
        context: AppFeedbackContext;
        title?: string;
        description?: string | ((error: unknown, variables: any) => string | undefined);
      };
  silentSuccess?: boolean;
  silentError?: boolean;
};

const resolveSuccessToast = (
  config: MutationDataOptions["successToast"],
  data: any,
  variables: any
) => {
  if (!config) return null;

  if (typeof config === "string") {
    return getToastConfig(config, "success");
  }

  return getToastConfig(config.context, "success", {
    title:
      typeof config.title === "function" ? config.title(data, variables) : config.title,
    description:
      typeof config.description === "function"
        ? config.description(data, variables)
        : config.description,
  });
};

const resolveErrorToast = (
  config: MutationDataOptions["errorToast"],
  error: unknown,
  variables: any
) => {
  if (!config) return null;

  if (typeof config === "string") {
    return getToastConfig(config, "error", {
      description: normalizeAppError(error, config),
    });
  }

  return getToastConfig(config.context, "error", {
    title: config.title,
    description:
      typeof config.description === "function"
        ? config.description(error, variables)
        : config.description ?? normalizeAppError(error, config.context),
  });
};

export const useMutationData = (
  mutationKey: MutationKey,
  mutationFn: MutationFunction<any, any>,
  options?: MutationDataOptions
) => {
  const client = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationKey,
    mutationFn,
    onMutate: async (variables) => {
      return await options?.onMutate?.(client, variables);
    },
    onError: (error, variables, context) => {
      const mutationContext = context || undefined;
      mutationContext?.rollback?.();
      options?.onError?.(client, error, variables, mutationContext);

      if (!options?.silentError && options?.errorToast !== false) {
        const toastConfig = resolveErrorToast(
          options?.errorToast ?? "generic",
          error,
          variables
        );
        if (toastConfig) {
          toast(toastConfig.title, { description: toastConfig.description });
        }
      }
    },
    onSuccess: (data, variables) => {
      if (options?.onSuccess) options.onSuccess(data, variables);
      options?.onSuccessUpdate?.(client, data, variables);

      if (data?.status !== 200) {
        if (!options?.silentError && options?.errorToast !== false) {
          const toastConfig = resolveErrorToast(
            options?.errorToast ?? "generic",
            data?.data,
            variables
          );
          if (toastConfig) {
            toast(toastConfig.title, { description: toastConfig.description });
          }
        }
        return;
      }

      if (!options?.silentSuccess && options?.successToast) {
        const toastConfig = resolveSuccessToast(options.successToast, data, variables);
        if (toastConfig) {
          toast(toastConfig.title, { description: toastConfig.description });
        }
      }
    },
    onSettled: async () => {
      if (!options?.invalidate?.length) return;

      await Promise.all(
        options.invalidate.map((queryKey) =>
          client.invalidateQueries({ queryKey })
        )
      );
    },
  });

  return { mutate, isPending };
};

export const useMutationDataState = (mutationKey: MutationKey) => {
  const data = useMutationState({
    filters: { mutationKey },
    select: (mutation) => {
      return {
        variables: mutation.state.variables as any,
        status: mutation.state.status,
      };
    },
  });

  const latestVariable = data[data.length - 1];
  return { latestVariable };
};
