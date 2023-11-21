import type { PropsFrom, Subscriber } from './index.ts';
import type { FieldType } from 'denodb/lib/data-types.ts';
import type { ModelFields } from 'denodb/lib/model.ts';

export type SubscriberFields = PropsFrom<Subscriber, FieldType> & ModelFields;