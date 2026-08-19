import { useState } from "react";
import { errorMessage } from "../lib/api";

export const useFormAction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    }
    setLoading(false);
  };

  return { loading, error, success, setError, setSuccess, run };
};
