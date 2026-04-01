import {
  AutomationDuoToneWhite,
  HomeDuoToneWhite,
  RocketDuoToneWhite,
  SettingsDuoToneWhite,
} from "@/icons";
import { v4 as uuid } from "uuid";

export type FieldProps = {
  label: string;
  path: string;
  id: string;
};

type SideBarProps = {
  icon: React.ReactNode;
} & FieldProps;

export const SIDEBAR_MENU: SideBarProps[] = [
  {
    id: uuid(),
    label: "Overview",
    path: "",
    icon: <HomeDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "Automations",
    path: "automations",
    icon: <AutomationDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "Channels",
    path: "integrations",
    icon: <RocketDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "Billing",
    path: "settings",
    icon: <SettingsDuoToneWhite />,
  },
];
