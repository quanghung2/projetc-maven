import { STUN_SERVER } from '@b3networks/shared/common';

export const sip8b3 = {
  serverLocation: 'Singapore',
  basicSipConfiguration: {
    codecSupported: 'G.729, GSM, G.711A, G.711U',
    protocol: 'SIP TCP/TLS',
    registrationPeriod: '3600 s',
    audioFormat: 'RTP/SRTP',
    payLoadSize: '20 ms',
    dtmf: 'RFC2833'
  },
  firewallConfig: {
    signaling: {
      ip: ['13.215.166.60'],
      ports: '5060 (TCP), 5061 (TLS)',
      direction: 'Both incoming and outgoing'
    },
    audio: {
      ips: ['54.251.255.196 to 54.251.255.211'],
      ports: '10000-30000',
      direction: 'Both incoming and outgoing'
    }
  },
  natConfig: {
    traversal: 'STUN',
    stunServer: STUN_SERVER,
    port: '3478-3479',
    protocol: 'UDP',
    direction: 'Both incoming and outgoing'
  },
  sipDomainDesc: 'Sip domain is used for Singapore and International networks.',
  notSupports: [
    'Fax / Fax-over-IP',
    'Blind Call Transfer',
    'SIP Subscribe',
    'SIP Message',
    'SIP Publish',
    'Session Timers',
    'P-Asserted-Identity',
    'Remote-Party-ID',
    'Voice Activity Detection',
    'SIP ALG'
  ]
};
