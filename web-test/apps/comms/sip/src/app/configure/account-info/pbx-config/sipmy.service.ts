import { STUN_SERVER } from '@b3networks/shared/common';

export const sipmy = {
  serverLocation: 'Singapore - Zone A',
  basicSipConfiguration: {
    codecSupported: 'G.729, GSM, G.711A, G.711U',
    protocol: 'SIP UDP (RFC3261)',
    registrationPeriod: '3600 s',
    audioFormat: 'RTP',
    payLoadSize: '20 ms',
    dtmf: 'RFC2833'
  },
  firewallConfig: {
    signaling: {
      ip: ['202.79.210.70'],
      ports: '5060 (UDP)',
      direction: 'Both incoming and outgoing'
    },
    audio: {
      ips: ['122.152.145.103', '122.152.145.104', '122.152.145.107', '122.152.145.116', '54.251.99.231'],
      ports: '10000-30000 (UDP)',
      direction: 'Both incoming and outgoing'
    }
  },
  natConfig: {
    traversal: 'STUN',
    stunServer: STUN_SERVER,
    port: '3478',
    protocol: 'UDP/TCP',
    direction: 'Both incoming and outgoing'
  },
  sipDomainDesc: 'Sip domain is used for Malaysia and International networks.',
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
