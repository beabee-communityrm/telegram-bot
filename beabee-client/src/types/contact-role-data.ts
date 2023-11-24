import type { RoleType } from '@beabee/beabee-common';
import type { UpdateContactRoleData } from './index.ts';

export interface ContactRoleData extends UpdateContactRoleData {
  role: RoleType;
}
