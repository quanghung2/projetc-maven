export const environment = {
  production: true,
  env: 'prod',
  settings: {
    portalDomain: 'portal.hoiio.com',
    appId: 'KwaKqO8kkkTjGUXT',
    s3Bucket: 'apps-sip',
    s3Folder: 'prod',
    apiUrl: location.origin + '/_a',
    crApiUrl: `${location.origin}/_a/callrecording`,
    signUrl: `${location.origin}/_a/portal/private/v1/s3`
  }
};
