import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({
  width = 200,
  height = 80,
  className = "",
}: LogoProps) {
  return (
    <Image
      src="/replyot-logo.svg"
      alt="Replyot"
      width={width}
      height={height}
      className={cn("h-auto", className)}
      priority
    />
  );
}
