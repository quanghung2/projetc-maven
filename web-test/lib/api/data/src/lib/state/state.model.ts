export class Agent {
  uuid: string;
  extensionKey: string;
  extensionLabel: string;
}

export class AgentStatus {
  agent: Agent;
  remark: string;
  status: string;
  timestamp: number;
}

export class State {
  timestamp: number;
  extensionKey: string;
  extensionLabel: string;
}

export class States {
  talking: State;
  waiting: State;
  connecting: State;
}

export class CallInQueue {
  code: string;
  note: string;
  first: States;
  status: string;
  txnUuid: string;
  callerId: string;
  queueName: string;
  queueUuid: string;
  incomingNumber: string;
  timestamp: number;
}

export class Queue {
  name: string;
  uuid: string;
  agents: string[];
  timestamp: number;
}
