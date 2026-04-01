import { InstagramDuoToneBlue, Message } from "@/icons";

type Props = {
  title: string;
  icon: React.ReactNode;
  description: string;
  strategy: "INSTAGRAM" | "FACEBOOK_MESSENGER";
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
];
