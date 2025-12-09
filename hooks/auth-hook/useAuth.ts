// /hooks/auth-hook/useAuth.ts
"use client";

import { authApi } from "@/lib/auth/authApi";
import { useMutation } from "@tanstack/react-query";

type SigninInput = {
  identifier: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterInput = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export const useSignin = () => {
  return useMutation({
    mutationFn: (input: SigninInput) =>
      authApi.login(input.identifier, input.password, input.rememberMe),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      authApi.register(
        input.fullName,
        input.username,
        input.email,
        input.phoneNumber,
        input.password
      ),
  });
};
