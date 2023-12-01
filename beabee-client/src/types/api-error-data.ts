export interface ApiErrorData {
    code?: string;
    errors?: {
        [key: string]: any;
    },
    httpCode?: number;
}