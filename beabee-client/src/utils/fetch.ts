// deno-lint-ignore-file no-explicit-any
import { isJson } from "./index.ts";

import type { FetchOptions, FetchResponse, HttpMethod } from "../types/index.ts";

/**
 * A wrapper for the fetch API with some additional features.
 */
class Fetch {
    /**
     * Set header for each request
     * @param name Header name
     * @param value Header value
     */
    public setRequestHeaderEachRequest(name: string, value: string) {
        this._requestHeadersEachRequest[name] = value
    }

    /**
     * Load data from the server using a HTTP POST request.
     * @param url A string containing the URL to which the request is sent.
     * @param data A plain object or string that is sent to the server with the request.
     * @param options Options for the request
     */
    public post<T = any, D = any>(
        url: string,
        data?: D,
        options: FetchOptions = {},
    ) {
        return this.fetch<T>(url, "POST", data, options);
    }

    public delete<T = any, D = any>(
        url: string,
        data?: D,
        options: FetchOptions = {},
    ) {
        return this.fetch<T>(url, "DELETE", data, options);
    }

    public put<T = any, D = any>(
        url: string,
        data?: D,
        options: FetchOptions = {},
    ) {
        return this.fetch<T>(url, "PUT", data, options);
    }

    /**
     * Load data from the server using a HTTP GET request.
     * @param url A string containing the URL to which the request is sent.
     * @param data A plain object or string that is sent to the server with the request.
     * @param dataType The type of data expected from the server. Default: Intelligent Guess (xml, json, script, text, html).
     * @param options Additional options for the request
     */
    public get<T = unknown, D = any>(
        url: string,
        data?: D,
        options: FetchOptions = {},
    ) {
        return this.fetch<T>(url, "GET", data, options);
    }

    /**
     * Parse the dataType to headers
     * @param dataType The type of data expected from the server. Default: Intelligent Guess (xml, json, script, text, html).
     */
    protected parseDataType(dataType: string) {
        const headers: Record<string, string> = {};
        let contentType = "application/x-www-form-urlencoded";
        let accept = "*/*";
        switch (dataType) {
            case "script":
                contentType = "application/javascript";
                break;
            case "json":
                contentType = "application/json";
                accept = "application/json, text/javascript";
                break;
            case "xml":
                contentType = "application/xml";
                accept = "application/xml, text/xml";
                break;
            case "text":
                contentType = "text/plain";
                accept = "text/plain";
                break;
            case "html":
                contentType = "text/html";
                accept = "text/html";
                break;
            case "form":
                contentType = "application/x-www-form-urlencoded";
                break;
        }
        if (contentType) {
            headers["Content-Type"] = contentType;
            headers["Accept"] = accept;
        }
        return headers;
    }

    protected async fetch<T = unknown, D = any>(
        url: string,
        method: HttpMethod = "GET",
        data: D,
        options: FetchOptions = {},
    ): Promise<FetchResponse<T>> {
        if (!fetch) {
            throw new Error(
                "Your platform does not support the fetch API, use xhr instead or install a polyfill.",
            );
        }

        // Set default options
        const dataType = options.dataType || 'json'
        const cache = options.cache ? options.cache : "default";
        const credentials = options.credentials || "same-origin";
        method ||= options.method || "GET";
        let body = options.body;
        const mode = options.mode || "cors";

        const headers: Record<string, string> = { ...this._requestHeadersEachRequest, ...options.headers, ...this.parseDataType(dataType) };

        // This is a common technique used to identify Ajax requests.
        // The `X-Requested-With` header is not a standard HTTP header, but it is commonly used in the context of web development.
        if (!options.isAjax && !headers["X-Requested-With"]) {
            headers["X-Requested-With"] = "XMLHttpRequest";
        }

        // If this is a GET request and there is data, add query string to url
        if (method === "GET" && data) {
            const queryStr = new URLSearchParams(data).toString();
            if (queryStr) {
                const separator = url.includes("?") ? "&" : "?";
                url = url + separator + new URLSearchParams(data).toString();
            }
        } else if (data) {
            if (dataType === "form") {
                body = new URLSearchParams(data);
            } else {
                body = JSON.stringify(data);
            }
        }

        const response = await globalThis.fetch(url, {
            ...options,
            credentials,
            cache,
            method,
            body,
            headers,
            mode,
        });

        // Automatically parse json response
        let bodyResult = (await response.text()) as unknown as T;
        if (typeof bodyResult === "string" && isJson(bodyResult)) {
            bodyResult = JSON.parse(bodyResult);
        }

        if (typeof bodyResult === "string") {
            switch (bodyResult) {
                case "null":
                    bodyResult = null as unknown as T;
                    break;
                case "true":
                    bodyResult = true as unknown as T;
                    break;
                case "false":
                    bodyResult = false as unknown as T;
                    break;
                case "undefined":
                    bodyResult = undefined as unknown as T;
                    break;
            }
        }

        const result: FetchResponse<T> = {
            ...response,
            data: bodyResult,
        };
        return result;
    }

    /**
     * Header name value pair to send on each request
     */
    protected _requestHeadersEachRequest: Record<string, string> = {};
}

// Export a singleton

/**
 * A wrapper for the fetch API with some additional features.
 */
export const fetch = new Fetch();