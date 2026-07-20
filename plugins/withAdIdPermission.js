// Belt-and-suspenders enforcement of com.google.android.gms.permission.AD_ID.
//
// The official path is expo-tracking-transparency (in dependencies and
// registered in app.json) which adds the permission via Expo's canonical
// withPermissions API. This plugin runs AFTER it and force-sets
// tools:node="replace" on the entry, defeating any library that ships a
// <uses-permission AD_ID tools:node="remove"/> directive in its AAR (the
// Facebook Android SDK 16.1+ does this conditionally). Stacking both covers
// the "permission never made it into the source manifest" and the "library
// stripped it during merge" failure modes of Play Console's AD_ID check.
const { withAndroidManifest } = require('@expo/config-plugins');

const AD_ID = 'com.google.android.gms.permission.AD_ID';
const TOOLS_NS = 'http://schemas.android.com/tools';

function withAdIdPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) manifest.$['xmlns:tools'] = TOOLS_NS;

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    const existing = manifest['uses-permission'].find(
      (p) => p && p.$ && p.$['android:name'] === AD_ID,
    );

    if (existing) {
      existing.$['tools:node'] = 'replace';
    } else {
      manifest['uses-permission'].push({
        $: {
          'android:name': AD_ID,
          'tools:node': 'replace',
        },
      });
    }

    return cfg;
  });
}

module.exports = withAdIdPermission;
