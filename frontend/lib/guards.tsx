"use client";
import { useAuth } from "./auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (!user) return null;
  return <>{children}</>;
}

export function StaffOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace("/login");
    if (user.role === "client") router.replace("/client");
  }, [loading, user, router]);
  if (!user || user.role === "client") return null;
  return <>{children}</>;
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace("/login");
    if (user.role !== "client") router.replace("/dashboard");
  }, [loading, user, router]);
  if (!user || user.role !== "client") return null;
  return <>{children}</>;
}
