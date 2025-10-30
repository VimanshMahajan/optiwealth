import api from "./api";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface UserDto {
    id: number;
    username: string;
    email: string;
}

export interface LoginResponse {
    user: UserDto;
    token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await api.post("/auth/login", payload);
    return res.data as LoginResponse;
}

export async function register(payload: { username: string; email: string; password: string }) {
    const res = await api.post("/auth/register", payload);
    return res.data;
}
