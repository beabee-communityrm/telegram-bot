import type { RoleType } from "../deps.ts";
import type { UpdateContactRoleData } from "./index.ts";

export interface ContactRoleData extends UpdateContactRoleData {
  role: RoleType;
}
