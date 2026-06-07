const { IOSConfig, withXcodeProject } = require('@expo/config-plugins');
const plistPackage = require('@expo/plist');
const plist = plistPackage.default ?? plistPackage;
const fs = require('fs');
const path = require('path');
const { addResourceFileToGroup } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const SETTINGS_BUNDLE_NAME = 'Settings.bundle';

const preferenceSpecifiers = [
  {
    Type: 'PSGroupSpecifier',
    Title: 'Privacy',
    FooterText:
      'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.',
  },
  {
    Type: 'PSTitleValueSpecifier',
    Title: 'Microphone Access',
    Key: 'microphone_access',
    DefaultValue: 'Managed by iOS',
  },
  {
    Type: 'PSGroupSpecifier',
    Title: 'Language',
    FooterText:
      'Preferred Language is managed by iOS because this app declares its supported languages.',
  },
  {
    Type: 'PSTitleValueSpecifier',
    Title: 'Preferred Language',
    Key: 'preferred_language',
    DefaultValue: 'Managed by iOS',
  },
  {
    Type: 'PSGroupSpecifier',
    Title: 'Background Measurement',
    FooterText:
      'Background microphone processing is enabled through the iOS audio background mode while measurement is running.',
  },
  {
    Type: 'PSToggleSwitchSpecifier',
    Title: 'Allow Background Measurement',
    Key: 'allow_background_measurement',
    DefaultValue: true,
  },
];

const localizedStrings = {
  en: {
    Privacy: 'Privacy',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.',
    'Microphone Access': 'Microphone Access',
    'Managed by iOS': 'Managed by iOS',
    Language: 'Language',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      'Preferred Language is managed by iOS because this app declares its supported languages.',
    'Preferred Language': 'Preferred Language',
    'Background Measurement': 'Background Measurement',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      'Background microphone processing is enabled through the iOS audio background mode while measurement is running.',
    'Allow Background Measurement': 'Allow Background Measurement',
  },
  ko: {
    Privacy: '개인정보 보호',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      '마이크 접근 권한은 iOS가 관리합니다. 앱이 권한을 요청한 뒤 이 설정 화면에 마이크 토글이 표시됩니다.',
    'Microphone Access': '마이크 접근',
    'Managed by iOS': 'iOS에서 관리',
    Language: '언어',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      '이 앱은 지원 언어를 선언하므로 선호 언어는 iOS가 관리합니다.',
    'Preferred Language': '선호 언어',
    'Background Measurement': '백그라운드 측정',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      '측정 중 백그라운드 마이크 처리는 iOS 오디오 백그라운드 모드로 활성화됩니다.',
    'Allow Background Measurement': '백그라운드 측정 허용',
  },
  ja: {
    Privacy: 'プライバシー',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      'マイクへのアクセスはiOSが管理します。アプリがアクセスを要求した後、この設定画面にマイクの切り替えが表示されます。',
    'Microphone Access': 'マイクアクセス',
    'Managed by iOS': 'iOSで管理',
    Language: '言語',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      'このアプリは対応言語を宣言しているため、優先言語はiOSが管理します。',
    'Preferred Language': '優先言語',
    'Background Measurement': 'バックグラウンド測定',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      '測定中のバックグラウンドでのマイク処理は、iOSのオーディオバックグラウンドモードで有効になります。',
    'Allow Background Measurement': 'バックグラウンド測定を許可',
  },
  'zh-Hans': {
    Privacy: '隐私',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      '麦克风访问权限由 iOS 管理。应用请求访问后，麦克风开关会显示在此设置页面中。',
    'Microphone Access': '麦克风访问',
    'Managed by iOS': '由 iOS 管理',
    Language: '语言',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      '由于此应用声明了支持的语言，首选语言由 iOS 管理。',
    'Preferred Language': '首选语言',
    'Background Measurement': '后台测量',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      '测量运行时，后台麦克风处理会通过 iOS 音频后台模式启用。',
    'Allow Background Measurement': '允许后台测量',
  },
  'zh-Hant': {
    Privacy: '隱私權',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      '麥克風存取權限由 iOS 管理。App 要求存取後，麥克風切換會顯示在此設定頁面中。',
    'Microphone Access': '麥克風存取',
    'Managed by iOS': '由 iOS 管理',
    Language: '語言',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      '由於此 App 宣告了支援語言，偏好語言由 iOS 管理。',
    'Preferred Language': '偏好語言',
    'Background Measurement': '背景測量',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      '測量執行時，背景麥克風處理會透過 iOS 音訊背景模式啟用。',
    'Allow Background Measurement': '允許背景測量',
  },
  fr: {
    Privacy: 'Confidentialité',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      "L'accès au micro est géré par iOS. Après la demande d'accès par l'app, le réglage Micro apparaît sur cette page.",
    'Microphone Access': 'Accès au micro',
    'Managed by iOS': 'Géré par iOS',
    Language: 'Langue',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      "La langue préférée est gérée par iOS, car cette app déclare ses langues prises en charge.",
    'Preferred Language': 'Langue préférée',
    'Background Measurement': 'Mesure en arrière-plan',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      "Le traitement du micro en arrière-plan est activé par le mode audio en arrière-plan d'iOS pendant la mesure.",
    'Allow Background Measurement': 'Autoriser la mesure en arrière-plan',
  },
  es: {
    Privacy: 'Privacidad',
    'Microphone access is managed by iOS. After the app requests access, the Microphone toggle appears in this Settings page.':
      'El acceso al micrófono lo gestiona iOS. Después de que la app lo solicite, el interruptor Micrófono aparece en esta página de Ajustes.',
    'Microphone Access': 'Acceso al micrófono',
    'Managed by iOS': 'Gestionado por iOS',
    Language: 'Idioma',
    'Preferred Language is managed by iOS because this app declares its supported languages.':
      'El idioma preferido lo gestiona iOS porque esta app declara sus idiomas compatibles.',
    'Preferred Language': 'Idioma preferido',
    'Background Measurement': 'Medición en segundo plano',
    'Background microphone processing is enabled through the iOS audio background mode while measurement is running.':
      'El procesamiento del micrófono en segundo plano se activa mediante el modo de audio en segundo plano de iOS durante la medición.',
    'Allow Background Measurement': 'Permitir medición en segundo plano',
  },
};

function escapeStringsValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function buildStringsFile(translations) {
  return Object.entries(translations)
    .map(([key, value]) => `"${escapeStringsValue(key)}" = "${escapeStringsValue(value)}";`)
    .join('\n');
}

function writeSettingsBundle(settingsBundlePath) {
  fs.mkdirSync(settingsBundlePath, { recursive: true });
  fs.writeFileSync(
    path.join(settingsBundlePath, 'Root.plist'),
    plist.build({
      PreferenceSpecifiers: preferenceSpecifiers,
      StringsTable: 'Root',
    })
  );

  for (const [locale, translations] of Object.entries(localizedStrings)) {
    const localePath = path.join(settingsBundlePath, `${locale}.lproj`);
    fs.mkdirSync(localePath, { recursive: true });
    fs.writeFileSync(path.join(localePath, 'Root.strings'), `${buildStringsFile(translations)}\n`);
  }
}

function normalizeSettingsBundleFileType(project) {
  const fileReferences = project.hash.project.objects.PBXFileReference;

  for (const fileReference of Object.values(fileReferences)) {
    if (!fileReference || fileReference.name !== SETTINGS_BUNDLE_NAME) {
      continue;
    }

    fileReference.lastKnownFileType = '"wrapper.cfbundle"';
    delete fileReference.explicitFileType;
  }
}

function withIosSettingsBundle(config) {
  return withXcodeProject(config, projectConfig => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(projectConfig.modRequest.projectRoot);
    const settingsBundlePath = path.join(
      projectConfig.modRequest.platformProjectRoot,
      projectName,
      SETTINGS_BUNDLE_NAME
    );
    const projectRelativePath = path.join(projectName, SETTINGS_BUNDLE_NAME);

    writeSettingsBundle(settingsBundlePath);

    if (!projectConfig.modResults.hasFile(projectRelativePath)) {
      projectConfig.modResults = addResourceFileToGroup({
        filepath: projectRelativePath,
        groupName: projectName,
        project: projectConfig.modResults,
        isBuildFile: true,
        verbose: true,
      });
    }

    normalizeSettingsBundleFileType(projectConfig.modResults);

    return projectConfig;
  });
}

module.exports = withIosSettingsBundle;
