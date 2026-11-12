import React from "react";
import useAuthSession from "../../hooks/useAuthSession";
import LoginPage from "../../pages/LoginPage";

export default function AuthGate({ children }) {
  const { restoring, user, error, login, logout, retry } = useAuthSession();

  if (user) return children(user, logout);

  return (
    <LoginPage
      restoring={restoring}
      sessionError={error}
      onLogin={login}
      onRetry={retry}
    />
  );
}
