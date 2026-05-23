type SettingsRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: '/db-freq') => void;
};

export function navigateBackFromSettings(router: SettingsRouter) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/db-freq');
}
