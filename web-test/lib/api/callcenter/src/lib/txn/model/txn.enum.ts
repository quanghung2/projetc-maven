export enum TxnType {
  crossAppIn = 'crossAppIn', // Direct Inbound Calls
  crossApp = 'crossApp', // Direct Outbound Calls
  callback = 'callback', // Call Center Scheduled Call Backs
  incoming = 'incoming', // Call Center Inbound Calls
  autodialer = 'autodialer', // Call Center Outbound Calls
  overflow = 'overflow',

  // add more type call
  incoming2extension = 'incoming2extension',
  outgoing = 'outgoing',
  outgoingFromSipGateway = 'outgoingFromSipGateway',
  internal = 'internal',
  chat = 'chat',
  booking = 'booking'
}

// if TxnType === chat
export enum ChatTypeTxn {
  livechat = 'livechat',
  whatsapp = 'whatsapp',
  sms = 'sms',
  email = 'email',
  supportCenter = 'supportCenter'
}

export const DirectInboundCalls = [TxnType.incoming2extension]; // crossAppIn
export const DirectOutboundCalls = [TxnType.outgoing, TxnType.outgoingFromSipGateway, TxnType.internal]; //crossApp

export enum CallBaseStatus {
  talking = 'talking',
  holding = 'holding',
  agentMarkCallDone = 'agentMarkCallDone',
  hangupBySupervisor = 'hangupBySupervisor',
  ended = 'ended'
}

export enum IncomingCallStatus {
  waiting = 'waiting',
  connecting = 'connecting',
  callback = 'callback',
  voicemail = 'voicemail'
}

export enum CallbackCallStatus {
  waiting = 'waiting',
  dialing = 'dialing'
}

export enum AutoDialerCallStatus {
  ready = 'ready',
  inQueued = 'inQueued',
  previewing = 'previewing',
  dialingAgent = 'dialingAgent',
  agentSkip = 'agentSkip',
  agentUnanswered = 'agentUnanswered',
  agentBusy = 'agentBusy',
  agentTransferFailed = 'agentTransferFailed',
  dialingCustomer = 'dialingCustomer',
  customerUnanswered = 'customerUnanswered',
  customerHangup = 'customerHangup',
  customerBusy = 'customerBusy',
  customerTransferFailed = 'customerTransferFailed',
  talked = 'talked'
}
