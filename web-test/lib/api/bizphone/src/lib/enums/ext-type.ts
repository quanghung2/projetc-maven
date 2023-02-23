export enum ExtType {
  NORMAL = 'NORMAL',
  CALL_CENTER = 'CALL_CENTER'
}

export enum RingMode {
  ringAll = 'ringAll', // cdConfig , ringConfig
  sequential = 'sequential', // cdConfig, ringConfig
  roundRobin = 'roundRobin', // cdConfig
  longestIdle = 'longestIdle', // cdConfig
  proficiency = 'proficiency',
  stickyAgent = 'stickyAgent'
}

export enum ValueRingMode {
  ringAll = 'Ring all',
  roundRobin = 'Round robin',
  proficiency = 'Proficiency level',
  stickyAgent = 'Sticky agent'
}
