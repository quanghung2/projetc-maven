// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  env: 'development',
  production: false,
  enableLogSentry: false,
  useHash: false,
  s3Bucket: 'apps-local',
  s3BaseFolder: 'callcenter',
  appId: 'Y4v35i2TXBM0XL2l',
  globalDncAppId: 'LzgWeisit8OewfM1',
  outboundFeatureCode: 'outbound',
  inboundFeatureCode: 'inbound'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
