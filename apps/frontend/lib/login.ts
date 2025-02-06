import { getApiURL } from "./utils";

export function login(provider: string) {
    window.location.href = getApiURL(`/auth/login/${provider}`);
}