import { STUN_SERVER } from '@b3networks/shared/common';

export const sipsg = {
  serverLocation: 'Singapore - Zone A',
  basicSipConfiguration: {
    codecSupported: 'G.729, GSM, G.711A, G.711U',
    protocol: 'SIP TCP (RFC3261)',
    registrationPeriod: '3600 s',
    audioFormat: 'RTP',
    payLoadSize: '20 ms',
    dtmf: 'RFC2833'
  },
  firewallConfig: {
    signaling: {
      ip: ['54.251.255.196'],
      ports: '5060 (TCP)',
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
    port: '3478',
    protocol: 'TCP',
    direction: 'Both incoming and outgoing'
  },
  sipDomainDesc: 'Sip domain is used for Singapore and International networks.',
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
