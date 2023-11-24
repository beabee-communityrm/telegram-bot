import { ItemStatus } from '@beabee/beabee-common';
import { NoticeData } from './index.ts';

export interface GetNoticeData extends NoticeData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: ItemStatus;
}
