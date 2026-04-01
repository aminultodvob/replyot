"use client";

import Link, { LinkProps } from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useDashboardNavigationFeedback } from "./navigation-feedback";

type Props = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: React.ReactNode;
  };

const DashboardLink = ({
  children,
  href,
  onMouseEnter,
  onFocus,
  onClick,
  ...props
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startNavigation } = useDashboardNavigationFeedback();
  const hrefString = typeof href === "string" ? href : href.toString();
  const currentUrl = React.useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const prefetch = React.useCallback(() => {
    if (hrefString.startsWith("/dashboard")) {
      router.prefetch(hrefString);
    }
  }, [hrefString, router]);

  return (
    <Link
      {...props}
      href={href}
      prefetch
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      onClick={(event) => {
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          hrefString.startsWith("/dashboard") &&
          hrefString !== currentUrl
        ) {
          startNavigation();
        }

        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
};

export default DashboardLink;
