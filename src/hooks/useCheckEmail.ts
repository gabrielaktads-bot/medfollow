import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCheckEmail = () => {
  const [checking, setChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const checkEmail = useCallback(async (email: string) => {
    if (!email?.trim() || !email.includes("@")) {
      setEmailExists(null);
      return;
    }
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-or-create-user", {
        body: { email: email.trim(), check_only: true },
      });
      if (error) throw error;
      setEmailExists(data?.exists ?? null);
    } catch {
      setEmailExists(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const reset = useCallback(() => setEmailExists(null), []);

  return { checkEmail, checking, emailExists, reset };
};
