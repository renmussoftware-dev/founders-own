# Meta (Facebook) SDK — how to turn it on

The Meta ads + event-tracking integration is fully built and wired, but
**disabled during the testing phase**. Nothing fires and the native SDK is not
configured. To enable it when ready:

## 1. Flip the runtime switch
In `src/utils/analytics.ts`, set:

```ts
const META_ENABLED = true;
```

## 2. Add the plugins back to `app.json`
Insert these back into the `expo.plugins` array (after `"expo-secure-store"`),
and fill in the real Meta App ID + Client Token (from the **Founders Own** app
at developers.facebook.com — do NOT reuse Fretionary's):

```json
[
  "react-native-fbsdk-next",
  {
    "appID": "REPLACE_WITH_META_APP_ID",
    "clientToken": "REPLACE_WITH_META_CLIENT_TOKEN",
    "displayName": "Founders Own",
    "scheme": "fbREPLACE_WITH_META_APP_ID",
    "advertiserIDCollectionEnabled": true,
    "autoLogAppEventsEnabled": true,
    "isAutoInitEnabled": true,
    "iosUserTrackingPermission": "Allow Founders Own to use your activity to measure ad performance, so we can reach founders like you and keep the app affordable."
  }
],
[
  "expo-tracking-transparency",
  {
    "userTrackingPermission": "Allow Founders Own to use your activity to measure ad performance, so we can reach founders like you and keep the app affordable."
  }
],
"./plugins/withAdIdPermission"
```

The custom `plugins/withAdIdPermission.js` is already in the repo (forces the
Android `AD_ID` permission through Play manifest merging).

## 3. Rebuild + connect Meta
- Config plugins run at prebuild, so trigger a new dev/EAS build.
- In Meta **Events Manager**, connect the app dataset.
- In **RevenueCat → Integrations → Meta Ads**, enable the integration so
  subscription conversions are sent server-side (the FB-anonymous-ID link in
  `useRevenueCat` supports this for ATT-denied users).

Deps (`react-native-fbsdk-next`, `expo-tracking-transparency`,
`@react-native-async-storage/async-storage`) stay installed either way.
