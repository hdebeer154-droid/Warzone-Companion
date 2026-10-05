import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Home: undefined;
  Camos: undefined;
  Weapons: undefined;
  Challenges: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabsParamList>;
  Scanner: undefined;
  WeaponDetail: { weaponId: string };
  MatchDetail: { matchId: string };
  CallingCardDetail: { id: string };
  EventDetail: { id: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
