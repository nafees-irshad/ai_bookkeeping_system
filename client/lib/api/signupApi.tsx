import { api } from "./index";
import { ENDPOINTS } from "./endpoints";

export interface SignupData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    password2: string;
}

export interface SignupResponse {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
}

export async function signup(data: SignupData): Promise<SignupResponse> {
    return api<SignupResponse>(ENDPOINTS.AUTH.SIGNUP, {
        method: "POST",
        body: JSON.stringify(data),
    });
}
