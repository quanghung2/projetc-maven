export const environment = {
  production: true,
  apiUrl: '',
  api: {
    endpoint: '',
    bizPhonePath: '/bizphone/private/v1',
    directLinePath: '/directline/private/callrecording/v2',
    virtualLinePath: '/virtualline/private/callrecording/v4',
    sipPath: '/sipv2/private/callrecording/v1'
  },
  app: {
    env: 'prod',
    id: 'rI7ukOeAvYhZfFrh',
    backend: '/callrecording',
    frontend: 'https://apps.hoiio.com/callrecording-v2',
    apps: {
      sip: 'KwaKqO8kkkTjGUXT',
      virtualline: '4ESLmjmXaWH0jcxT',
      directline: 'R8vdwGEirnQ607EV',
      bizphone: '5UrKHpufDbLWOijG',
      cr: 'rI7ukOeAvYhZfFrh',
      extension: 'uQwJTR1g9NLKNASU',
      number: 'GKraxgaqym78X2uY',
      wallboard: 'Y4v35i2TXBM0XL2l'
    }
  },
  session: {
    cookie: 'session'
  }
};
