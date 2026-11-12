export const sessionExpiredEvent = "peoplehub:session-expired";

let sessionVersion = 0;

export const currentSessionVersion = () => sessionVersion;
export const advanceSessionVersion = () => ++sessionVersion;

export function expireSession(version) {
  if (version !== sessionVersion) return;
  advanceSessionVersion();
  window.dispatchEvent(new Event(sessionExpiredEvent));
}
