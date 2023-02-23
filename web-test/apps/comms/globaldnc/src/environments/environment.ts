export const environment = {
  production: true,
  env: 'prod',
  settings: {
    portalUrl: 'https://portal.hoiio.com',
    sessionToken: 'session',
    dncContext: 'dnc',
    authContext: 'auth',
    bizphoneContext: 'bizphone',
    appId: 'LzgWeisit8OewfM1',
    s3Bucket: 'api-global-dnc',
    s3BaseFolder: 'prod',
    s3BulkFilteringFolder: 'bulkFiltering/request',
    s3BulkUpdateConsentBaseFolder: 'bulkUpdateConsent/request',
    redirectUrl:
      'https://portal.hoiio.com/auth/?redirectUrl=' +
      encodeURIComponent('https://portal.hoiio.com/subscription' + '#login')
  }
};
