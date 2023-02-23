import { STUN_SERVER } from '@b3networks/shared/common';

export const siptls = {
  serverLocation: 'Singapore - Zone B',
  basicSipConfiguration: {
    codecSupported: 'G.729, GSM, G.711A, G.711U',
    protocol: 'SIP-TLS',
    protocolMethod: 'TLSv1.2 or newer',
    registrationPeriod: '3600 s',
    audioFormat: 'SRTP',
    payLoadSize: '20 ms',
    dtmf: 'RFC2833'
  },
  firewallConfig: {
    signaling: {
      ip: ['46.137.216.222'],
      ports: '5061 (TCP)',
      direction: 'Both incoming and outgoing'
    },
    audio: {
      ips: ['122.152.145.105', '54.251.255.196 to 54.251.255.211'],
      ports: '10000-30000',
      direction: 'Both incoming and outgoing'
    }
  },
  natConfig: {
    traversal: 'STUN',
    stunServer: STUN_SERVER,
    port: '3478',
    protocol: 'TCP',
    direction: 'Both incoming and outgoing'
  },
  sipDomainDesc:
    'Sip domain is used for Singapore and International networks and is secured with TLS and SRTP protocols. Please change your PBX settings following the configurations in the Info section below.',
  notSupports: [
    'Call Transfer',
    'SIP Refer',
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
