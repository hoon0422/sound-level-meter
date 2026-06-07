const { IOSConfig, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const LOCALE_ALIASES = {
  'zh-CN': ['zh-Hans'],
  'zh-TW': ['zh-Hant'],
};

function escapeInfoPlistString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function getMicrophonePermissionMessages(projectRoot) {
  const localesPath = path.join(projectRoot, 'locales');

  return fs.readdirSync(localesPath).reduce((messages, fileName) => {
    if (!fileName.endsWith('.json')) {
      return messages;
    }

    const locale = path.basename(fileName, '.json');
    const localeContent = JSON.parse(fs.readFileSync(path.join(localesPath, fileName), 'utf8'));
    const message = localeContent?.permissions?.micMessage;

    if (!message) {
      return messages;
    }

    messages[locale] = message;

    for (const alias of LOCALE_ALIASES[locale] ?? []) {
      messages[alias] = message;
    }

    return messages;
  }, {});
}

function withLocalizedMicrophonePermissions(config) {
  return withDangerousMod(config, [
    'ios',
    async nextConfig => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(nextConfig.modRequest.projectRoot);
      const iosProjectPath = path.join(nextConfig.modRequest.platformProjectRoot, projectName);
      const microphonePermissionMessages = getMicrophonePermissionMessages(nextConfig.modRequest.projectRoot);

      for (const [locale, message] of Object.entries(microphonePermissionMessages)) {
        const localePath = path.join(iosProjectPath, `${locale}.lproj`);
        const stringsPath = path.join(localePath, 'InfoPlist.strings');
        const stringsContent = `"NSMicrophoneUsageDescription" = "${escapeInfoPlistString(message)}";\n`;

        fs.mkdirSync(localePath, { recursive: true });
        fs.writeFileSync(stringsPath, stringsContent);
      }

      return nextConfig;
    },
  ]);
}

module.exports = withLocalizedMicrophonePermissions;
