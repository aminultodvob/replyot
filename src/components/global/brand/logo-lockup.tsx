import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  logoClassName?: string;
  priority?: boolean;
};

const LogoLockup = ({ className, logoClassName, priority = false }: Props) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/replyot-logo.svg"
        alt="Replyot"
        width={190}
        height={39}
        priority={priority}
        className={cn("h-auto w-[150px] sm:w-[190px]", logoClassName)}
      />
    </div>
  );
};

export default LogoLockup;
