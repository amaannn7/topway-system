"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = { error: string | null };

export async function adminLoginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("admin", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin/dashboard",
    });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw err;
  }
}

export async function agentLoginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("agent", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/agent/dashboard",
    });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Incorrect username or password." };
    }
    throw err;
  }
}
