import { InstagramDuoToneBlue, Message } from "@/icons";
import { MessageCircleMore } from "lucide-react";

type Props = {
  title: string;
  icon: React.ReactNode;
  description: string;
  strategy: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
};

export const INTEGRATION_CARDS: Props[] = [
  {
    title: "Connect Instagram",
    description:
      "Connect Instagram to automate DMs and comment replies from one workspace.",
    icon: <InstagramDuoToneBlue />,
    strategy: "INSTAGRAM",
  },
  {
    title: "Connect Facebook Page",
    description:
      "Connect a Facebook Page to automate public comment replies on selected posts.",
    icon: <Message />,
    strategy: "FACEBOOK_MESSENGER",
  },
  {
    title: "Connect WhatsApp Business",
    description:
      "Connect a WhatsApp Business number through Meta Embedded Signup to automate inbound chats.",
    icon: <MessageCircleMore className="size-5" />,
    strategy: "WHATSAPP",
  },
];
