import { HttpMethod } from './index.ts';

export interface FetchOptions extends RequestInit {
  /** The type of data expected from the server. Default is 'json' */
  dataType?: string;
  isAjax?: boolean;
  method?: HttpMethod;
}
