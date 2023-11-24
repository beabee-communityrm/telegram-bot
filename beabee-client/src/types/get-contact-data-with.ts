import type {
  GetContactData,
  GetContactWith,
  ContactProfileData,
  ContributionInfo,
  ContactRoleData,
  Noop,
} from './index.ts';

export type GetContactDataWith<With extends GetContactWith> = GetContactData &
  ('profile' extends With ? { profile: ContactProfileData } : Noop) &
  ('contribution' extends With ? { contribution: ContributionInfo } : Noop) &
  ('roles' extends With ? { roles: ContactRoleData[] } : Noop);
