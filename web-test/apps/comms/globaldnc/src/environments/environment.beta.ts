export const environment = {
  production: false,
  env: 'beta',
  settings: {
    portalUrl: 'https://portal.hoiio.com',
    sessionToken: 'session',
    dncContext: 'dnc-uat',
    authContext: 'auth',
    bizphoneContext: 'bizphone-beta',
    appId: 'LzgWeisit8OewfM1',
    s3Bucket: 'api-global-dnc',
    s3BaseFolder: 'uat',
    s3BulkFilteringFolder: 'bulkFiltering/request',
    s3BulkUpdateConsentBaseFolder: 'bulkUpdateConsent/request',
    redirectUrl: 'https://portal.hoiio.com/auth/?redirectUrl=' + encodeURIComponent('http://app-dev.hoiio.com:4200/')
  }
};
