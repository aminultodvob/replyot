import {
  AutomationDuoToneBlue,
  ContactsDuoToneBlue,
  HomeDuoToneBlue,
  RocketDuoToneBlue,
  SettingsDuoToneWhite,
} from "@/icons";

export const PAGE_BREAD_CRUMBS: string[] = [
  "contacts",
  "automations",
  "integrations",
  "settings",
];

type Props = {
  [page in string]: React.ReactNode;
};

export const PAGE_ICON: Props = {
  AUTOMATIONS: <AutomationDuoToneBlue />,
  CONTACTS: <ContactsDuoToneBlue />,
  INTEGRATIONS: <RocketDuoToneBlue />,
  SETTINGS: <SettingsDuoToneWhite />,
  HOME: <HomeDuoToneBlue />,
};

export const BILLING_PACKAGE_FEATURES = [
  "10,000 Facebook comment replies each billing cycle",
  "1,000 Instagram direct messages each billing cycle",
  "10,000 Instagram comment replies each billing cycle",
  "Instagram and Facebook channel support",
  "Full automation builder and activation controls",
];

export const FREE_PACKAGE_FEATURES = [
  "1 connected channel at a time",
  "1 automation",
  "200 total deliveries each billing cycle",
  "Switch channel by disconnecting the current one",
];
