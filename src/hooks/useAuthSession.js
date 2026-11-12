import { useEffect, useState } from "react";
import { authApi } from "../services/authApi";
import {
  advanceSessionVersion,
  currentSessionVersion,
  expireSession,
  sessionExpiredEvent,
} from "../services/authSession";

const expiredMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
const profileError = "Không tải được thông tin tài khoản. Vui lòng thử lại.";

const signedOut = { user: null, expiresAt: null, restoring: false, error: "" };

export default function useAuthSession() {
  const [session, setSession] = useState({ ...signedOut, restoring: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onExpired = () => setSession({ ...signedOut, error: expiredMessage });
    window.addEventListener(sessionExpiredEvent, onExpired);
    return () => window.removeEventListener(sessionExpiredEvent, onExpired);
  }, []);

  useEffect(() => {
    if (session.expiresAt === null) return;

    const version = currentSessionVersion();
    let timer;
    const checkExpiry = () => {
      const remaining = session.expiresAt - Date.now();
      if (remaining <= 0) expireSession(version);
      else
        timer = window.setTimeout(
          checkExpiry,
          Math.min(remaining, 2_147_483_647),
        );
    };
    checkExpiry();
    return () => window.clearTimeout(timer);
  }, [session.expiresAt]);

  useEffect(() => {
    const controller = new AbortController();
    authApi
      .profile(controller.signal)
      .then((profile) => {
        if (controller.signal.aborted) return;
        advanceSessionVersion();
        setSession({ ...signedOut, ...profile });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (
          error.status === 401 ||
          error.status === 403 ||
          error.message === "Message.User.NotFound"
        ) {
          setSession(signedOut);
          return;
        }
        setSession({ ...signedOut, restoring: true, error: profileError });
      });
    return () => controller.abort();
  }, [attempt]);

  const login = async (username, password) => {
    await authApi.login(username, password);
    const profile = await authApi.profile();
    advanceSessionVersion();
    setSession({ ...signedOut, ...profile });
  };

  const logout = async () => {
    await authApi.logout();
    advanceSessionVersion();
    setSession(signedOut);
  };

  const retry = () => {
    setSession((current) => ({ ...current, error: "" }));
    setAttempt((current) => current + 1);
  };

  return { ...session, login, logout, retry };
}
