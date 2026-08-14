export function enablePwaUpdateRefresh() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  let refreshing = false;
  const refreshForNewController = () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  };

  const checkForUpdate = () => {
    void navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => undefined);
  };

  navigator.serviceWorker.addEventListener("controllerchange", refreshForNewController);
  window.addEventListener("focus", checkForUpdate);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
  checkForUpdate();
}
