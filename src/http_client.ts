import { API_BASE_URL } from "./config";
// START_OF Features.Auth
// import { dynamicConfig, SERVER_BASE_PATH } from "./config";
// import { validateAuth, ValidateAuthError } from "./auth";

// /** Escape HTML special characters to prevent XSS */
// function escapeHtml(str: string): string {
//     return str
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }
// END_OF Features.Auth

export interface HTTPClientParams {
    baseUrl: string;
}

export interface CallParams<T> {
    path: string;
    pathParams?: Record<string, string>;
    query?: Record<string, string | undefined>;
    method?: RequestInit['method'];
    headers?: Record<string, string | undefined>;
    body?: T;
    // START_OF Features.Auth
    // authorizationHeader?: string;
    // END_OF Features.Auth
}

export class HTTPClient {
    private baseUrl: string;

    constructor(params: HTTPClientParams) {
        this.baseUrl = params.baseUrl;
    }

    public async call<T>(params: CallParams<T>): Promise<Response> {
        // START_OF Features.Auth
        // const validateAuthResult = await validateAuth(params);

        // const signupUrl = new URL(SERVER_BASE_PATH + "/signup", dynamicConfig().MCP_SERVER_BASE_URL);
        // if (validateAuthResult === ValidateAuthError.LoginRequired) {
        //     const body = `<p>Login required. Please visit <a href="${signupUrl}">${signupUrl}</a> to sign up.</p>`;
        //     return new Response(body, {
        //         status: 401,
        //         headers: {
        //             "Content-Type": "text/html",
        //         },
        //     });
        // } else if (validateAuthResult === ValidateAuthError.UserNotFound) {
        //     const body = `<h1>User not found</h1><p>Please sign up again at <a href="${signupUrl}">${signupUrl}</a></p>`;
        //     return new Response(body, {
        //         status: 401,
        //         headers: {
        //             "Content-Type": "text/html",
        //         },
        //     });
        // }
        // END_OF Features.Auth

        let headers: Record<string, string> = {};
        if (params.headers) {
            const nonEmptyHeaders = Object.entries(params.headers).filter(([_, value]) => {
                return typeof value === "string";
            });
            headers = Object.fromEntries(nonEmptyHeaders) as Record<string, string>;
        }

        let query: Record<string, string> = {};
        if (params.query) {
            const nonEmptyQuery = Object.entries(params.query).filter(([_, value]) => {
                return typeof value === "string";
            });
            query = Object.fromEntries(nonEmptyQuery) as Record<string, string>;
        }

        let path = params.path;
        for (const [key, value] of Object.entries(params.pathParams ?? {})) {
            path = path.replace(`{${key}}`, value);
        }
        if (path.includes('{')) {
            throw new Error(`Not all path params were replaced in path: ${path}`);
        }

        const requestUrl = new URL(
            `${this.baseUrl}${path}?${new URLSearchParams(query).toString()}`,
        );
        const requestInit: RequestInit = {
            method: params.method,
            headers,
            body: JSON.stringify(params.body),
            redirect: "manual",
        };
        const res = await fetch(requestUrl.href, requestInit);

        // Follow at most one same-origin redirect; every fetch must stay manual.
        // https://github.com/bytecodealliance/StarlingMonkey/issues/297
        if (res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308) {
            const location = res.headers.get('Location');
            if (!location) return res;

            let redirectUrl: URL;
            try {
                redirectUrl = new URL(location, requestUrl);
            } catch {
                return res;
            }
            if (
                redirectUrl.origin !== requestUrl.origin ||
                redirectUrl.username ||
                redirectUrl.password
            ) {
                return res;
            }

            return fetch(redirectUrl.href, requestInit);
        }

        return res;
    }
}

export const httpClient = new HTTPClient({
    baseUrl: API_BASE_URL,
});
