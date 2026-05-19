import type { UserDTO } from "@ecommerce/types";
import { apiFetch } from "./api-client";

export function getMe(token: string | null | undefined): Promise<UserDTO> {
  return apiFetch<UserDTO>("/auth/me", { token });
}
