import { api } from "./index";
import { ENDPOINTS } from "./endpoints";
import { saveTokens } from "@/lib/auth/tokens";

/**
 * The request body the Django backend expects.
 * Django authenticates with a username and password.
 */
export interface LoginData {
    username: string;
    password: string;
}

export interface LoginUser {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
}

export interface LoginResponse {
    refresh: string;
    access: string;
    user: LoginUser;
}

interface LoginTokenResponse {
    refresh: string;
    access: string;
}

/**
 * Authenticate the user.
 * On success, access & refresh tokens are persisted to localStorage
 * and the full response (including user details) is returned.
 */
export async function login(data: LoginData): Promise<LoginResponse> {
    const tokens = await api<LoginTokenResponse>(ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        body: JSON.stringify(data),
    });
    const user = await api<LoginUser>(ENDPOINTS.AUTH.ME, { token: tokens.access });

    saveTokens(tokens.access, tokens.refresh);

    return { ...tokens, user };
}
