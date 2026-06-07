const { IOSConfig, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MICROPHONE_PERMISSION_MESSAGES = {
  en: 'This app requires microphone access to measure and display real-time ambient sound levels. Audio data is used only for decibel calculation and is never recorded or stored.',
  ko: '주변 소음 수치를 실시간으로 측정하고 표시하기 위해 마이크 권한이 필요합니다. 오디오 데이터는 데시벨 계산용으로만 사용되며, 절대 녹음되거나 저장되지 않습니다.',
  ja: '周囲の騒音レベルをリアルタイムで測定・表示するためにマイクへのアクセス権限が必要です。オーディオデータはデシベル計算のみに使用され、録音や保存されることはありません。',
  'zh-CN': '此应用需要麦克风权限来实时测量并显示环境噪音水平。音频数据仅用于计算分贝，绝不会被录制或存储。',
  'zh-Hans': '此应用需要麦克风权限来实时测量并显示环境噪音水平。音频数据仅用于计算分贝，绝不会被录制或存储。',
  'zh-TW': '此應用程式需要麥克風權限以即時測量並顯示環境噪音水平。音訊資料僅用於計算分貝，絕不會被錄製或儲存。',
  'zh-Hant': '此應用程式需要麥克風權限以即時測量並顯示環境噪音水平。音訊資料僅用於計算分貝，絕不會被錄製或儲存。',
  fr: "Cette application nécessite l'accès au micro pour mesurer et afficher les niveaux sonores ambiants en temps réel. Les données audio sont utilisées uniquement pour le calcul des décibels et ne sont jamais enregistrées ni stockées.",
  es: 'Esta aplicación requiere acceso al micrófono para medir y mostrar los niveles de sonido ambiental en tiempo real. Los datos de audio se utilizan solo para el cálculo de decibelios y nunca se graban ni se almacenan.',
};

function escapeInfoPlistString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function withLocalizedMicrophonePermissions(config) {
  return withDangerousMod(config, [
    'ios',
    async nextConfig => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(nextConfig.modRequest.projectRoot);
      const iosProjectPath = path.join(nextConfig.modRequest.platformProjectRoot, projectName);

      for (const [locale, message] of Object.entries(MICROPHONE_PERMISSION_MESSAGES)) {
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
