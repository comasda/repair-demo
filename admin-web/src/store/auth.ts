// src/store/auth.ts
export type Role = "admin" | "technician" | "customer";
export type CurrentUser = { id: string; username: string; role: Role };

export const auth = {
  get token() {
    return localStorage.getItem("accessToken");
  },
  setToken(token: string) {
    localStorage.setItem("accessToken", token);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
  },
  get user(): CurrentUser | null {
    const raw = localStorage.getItem("currentUser");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  },
  setUser(u: CurrentUser) {
    localStorage.setItem("currentUser", JSON.stringify(u));
  },
  isAdminAuthed() {
    return !!this.token && this.user?.role === "admin";
  },
};
