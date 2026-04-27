#!/usr/bin/env node
// Patches react-native-audio-api to remove iOS 26.2-only symbols that cause
// compile errors on Xcode versions without the iOS 26.2 SDK.
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '../node_modules/react-native-audio-api/ios/audioapi/ios/system/AudioSessionManager.mm'
);

if (!fs.existsSync(target)) {
  console.log('patch-audio-api: target file not found, skipping');
  process.exit(0);
}

let src = fs.readFileSync(target, 'utf8');

// Replace iOS 26.2 dualRoute block with fallback
src = src.replace(
  /\} else if \(\[modeSTR isEqualToString:@"dualRoute"\]\) \{\s*if \(@available\(iOS 26\.2, \*\)\) \{\s*mode = AVAudioSessionModeDualRoute;\s*\} else \{\s*mode = AVAudioSessionModeDefault;\s*\}\s*\}/,
  '} else if ([modeSTR isEqualToString:@"dualRoute"]) {\n    mode = AVAudioSessionModeDefault;\n  }'
);

// Remove iOS 26.2 farFieldInput block entirely
src = src.replace(
  /\s*if \(\[option isEqualToString:@"farFieldInput"\]\) \{\s*if \(@available\(iOS 26\.2, \*\)\) \{\s*options \|= AVAudioSessionCategoryOptionFarFieldInput;\s*continue;\s*\}\s*\}\s*/,
  '\n\n    '
);

fs.writeFileSync(target, src, 'utf8');
console.log('patch-audio-api: patched AudioSessionManager.mm');
