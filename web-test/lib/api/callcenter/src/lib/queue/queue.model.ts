import { AgentId } from '../agent/agent-config';
import { CampaignInfo } from '../campaign/campaign';
import { TtsConfig, TTSType } from './tts-config';

export interface AssignedAgent {
  agentId: AgentId;
  proficiency?: number;
}

export enum PopupNotificationMode {
  afterPickup = 'afterPickup',
  dialing = 'dialing'
}

export interface AgentWorkflowConfig {
  codeOptions: string[];
  script: string;
  disableNotes: false;
  popupNotificationMode: PopupNotificationMode;
  noteTemplateId: string;
  wrapUpTimeInSeconds: number;
}

export class DialPlanAction {
  appendPrefix: string;
  numOfDigitRemoved: number;

  get formatted() {
    return `Remove ${this.numOfDigitRemoved} leading digits and prepend ${this.appendPrefix}`;
  }

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  static buildFrom(appendPrefix: string, numOfDigitRemoved: number): DialPlanAction {
    return new DialPlanAction({ appendPrefix: appendPrefix, numOfDigitRemoved: numOfDigitRemoved });
  }
}

export class DialPlanMatcher {
  startWiths: string[];
  withLengths: number[];

  get startWithsFormatted(): string {
    return this.startWiths ? this.startWiths.join(', ') : '';
  }

  get withLengthsFormatted(): string {
    return this.withLengths ? this.withLengths.join(', ') : '';
  }

  get formatted() {
    return `Start with ${this.startWithsFormatted} and has a length of ${this.withLengthsFormatted}`;
  }

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  static buildFrom(startWiths: string[], withLengths: number[]): DialPlanMatcher {
    return new DialPlanMatcher({ startWiths: startWiths, withLengths: withLengths });
  }
}

export class DialPlan {
  action: DialPlanAction = new DialPlanAction();
  matcher: DialPlanMatcher = new DialPlanMatcher();

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (obj) {
      this.action = new DialPlanAction(obj.action);
      this.matcher = new DialPlanMatcher(obj.matcher);
    }
  }
}

export class CallbackConfig {
  announcementMessage2agent: string;
  askCallerContactMessage: string;
  askCallerContactTimeout: number;
  byeMessage: string;
  callerId: string;
  confirmCallerContactMessage: string;
  confirmCallerContactTimeout: number;
  dialPlanList: DialPlan[];
  invalidContactMessage: string;
  maxDigitsCallerContact: number;
  reachLimitRetryInputContactMessage: string;
  retryAskCallerContactTimes: number;
  retryConfirmCallerContactTimes: number;
  validContactPattern: string;
  autoRecoveryCallback: boolean;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (obj) {
      this.dialPlanList = obj.dialPlanList ? obj.dialPlanList.map(dialPlan => new DialPlan(dialPlan)) : [];
    }
  }

  get announcementMessage2agentConfig(): TtsConfig {
    return new TtsConfig(this.announcementMessage2agent);
  }

  set announcementMessage2agentConfig(cfg: TtsConfig) {
    this.announcementMessage2agent = cfg.xml();
  }

  get askCallerContactMessageConfig(): TtsConfig {
    return new TtsConfig(this.askCallerContactMessage);
  }

  set askCallerContactMessageConfig(cfg: TtsConfig) {
    this.askCallerContactMessage = cfg.xml();
  }

  get confirmCallerContactMessageConfig(): TtsConfig {
    return new TtsConfig(this.confirmCallerContactMessage);
  }

  set confirmCallerContactMessageConfig(cfg: TtsConfig) {
    this.confirmCallerContactMessage = cfg.xml();
  }

  get byeMessageConfig(): TtsConfig {
    return new TtsConfig(this.byeMessage);
  }

  set byeMessageConfig(cfg: TtsConfig) {
    this.byeMessage = cfg.xml();
  }

  get reachLimitRetryInputContactMessageConfig(): TtsConfig {
    return new TtsConfig(this.reachLimitRetryInputContactMessage);
  }

  set reachLimitRetryInputContactMessageConfig(cfg: TtsConfig) {
    this.reachLimitRetryInputContactMessage = cfg.xml();
  }

  get invalidContactMessageConfig(): TtsConfig {
    return new TtsConfig(this.invalidContactMessage);
  }

  set invalidContactMessageConfig(cfg: TtsConfig) {
    this.invalidContactMessage = cfg.xml();
  }
}

export class MohConfig {
  public background: TtsConfig;
  public marketings: TtsConfig[] = [];

  constructor(moh: string) {
    const xmlParser = new DOMParser();
    const xmlSerializer = new XMLSerializer();

    const xmlDoc = xmlParser.parseFromString(`<xml>${moh}</xml>`, 'text/xml');
    const childs = xmlDoc.childNodes[0].childNodes;

    this.marketings = [];
    for (let i = 0; i < childs.length; i++) {
      const child = childs[i];

      if (child.nodeType !== 1) {
        continue;
      }

      const tts = new TtsConfig(xmlSerializer.serializeToString(child));
      if (tts.background) {
        this.background = tts;
        continue;
      }

      this.marketings.push(tts);
    }
  }

  public xml() {
    let xml = this.background ? this.background.xml() : '';
    for (const marketing of this.marketings) {
      // this is logic from TTS. DON"T CHANGE IT
      // Background - msg 1 - backgound - message 2 - background......
      // TTS will merge these file into one and return for wb
      xml = `${xml}${marketing.xml()}${this.background ? this.background.xml() : ''}`;
    }

    return xml;
  }
}

export enum ThresholdAction {
  hangup = 'hangup',
  callback = 'callback',
  redirect = 'redirect',
  genie = 'genie'
}

export enum RedirectType {
  number = 'number',
  extension = 'extension',
  queue = 'queue'
}

export class RedirectConfig {
  type: RedirectType;
  number = '';
  extKey = '';
  queueUuid = '';
}

export class ThresholdConfig {
  enabled = false;
  action = ThresholdAction.hangup;
  threshold = -1;
  hangupMessage: string;
  announcementMessage: string;
  redirectTo = new RedirectConfig();
  genieConfig: Transfer2GenieConfig;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.genieConfig = new Transfer2GenieConfig(null, obj.genieConfig);
    }
  }

  get hangupMessageConfig(): TtsConfig {
    return new TtsConfig(this.hangupMessage);
  }

  set hangupMessageConfig(cfg: TtsConfig) {
    this.hangupMessage = cfg.xml();
  }

  get callbackMessageConfig(): TtsConfig {
    return new TtsConfig(this.announcementMessage);
  }

  set callbackMessageConfig(cfg: TtsConfig) {
    this.announcementMessage = cfg.xml();
  }
}

export class PostCallConfig {
  senderNumber: string;
  message: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class CallflowConfig {
  musicOnHold: string;
  ringMode: string;
  ringMode2nd: string;
  welcomeMsg: string;
  marketingMsg: string;
  ringTime = 15;
  waitTime = 60;
  gatherMsg: string;
  gatherTimeout = 7;
  maxGatherTimes = -1;
  hangupMsgOnMaxGatherTimes: string;
  dialNumber = 0;

  digitsTriggerVoiceMail: string;
  digitsTriggerDetermineNextAgent: string;
  voicemailFlowId: string;

  digitsTriggerCallback: string;
  callbackFlowId: string;

  dialingThreshold: ThresholdConfig;
  maxQueueSizeThreshold: ThresholdConfig;
  maxWaitingTimeThreshold: ThresholdConfig;
  callbackConfig: CallbackConfig = new CallbackConfig();
  voicemailConfig: VoicemailConfig;
  genieCode: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (obj) {
      this.callbackConfig = new CallbackConfig(obj.callbackConfig);
      this.maxQueueSizeThreshold = new ThresholdConfig(obj.maxQueueSizeThreshold);
      this.maxWaitingTimeThreshold = new ThresholdConfig(obj.maxWaitingTimeThreshold);
      this.dialingThreshold = new ThresholdConfig(obj.dialingThreshold);
      this.voicemailConfig = new VoicemailConfig(obj.voicemailConfig);
    }
  }

  get marketingMsgConfig(): TtsConfig {
    return this.marketingMsg ? new TtsConfig(this.marketingMsg) : this.mohConfig.marketings[0] || new TtsConfig('');
  }

  get welcomeMsgConfig(): TtsConfig {
    return this.welcomeMsg
      ? new TtsConfig(this.welcomeMsg)
      : new TtsConfig(
          'Thank you for calling our company, you are the caller number {{QueuePosition}} in the queue, the estimated waiting time is approximately {{EWT}} minutes.'
        );
  }

  get gatherMsgConfig(): TtsConfig {
    return this.gatherMsg
      ? new TtsConfig(this.gatherMsg)
      : new TtsConfig(
          'All of our agents are currently busy. Please stay on the line and your call will be answered as soon as possible.'
        );
  }

  set gatherMsgConfig(cfg: TtsConfig) {
    this.gatherMsg = cfg.xml();
  }

  get hangupMsgOnMaxGatherTimesConfig(): TtsConfig {
    return new TtsConfig(this.hangupMsgOnMaxGatherTimes);
  }

  set hangupMsgOnMaxGatherTimesConfig(cfg: TtsConfig) {
    this.hangupMsgOnMaxGatherTimes = cfg.xml();
  }

  get enabledVoicemail(): boolean {
    return this.digitsTriggerVoiceMail !== '';
  }

  set enabledVoicemail(enb: boolean) {
    if (enb) {
      this.digitsTriggerVoiceMail = '1';
    } else {
      this.digitsTriggerVoiceMail = '';
      this.voicemailFlowId = '';
    }
  }

  get enabledCallback(): boolean {
    return this.digitsTriggerCallback !== '';
  }

  set enabledCallback(enb: boolean) {
    if (enb) {
      this.digitsTriggerCallback = '2';
    } else {
      this.digitsTriggerCallback = '';
      this.callbackFlowId = '';
      this.callbackConfig = new CallbackConfig();
    }
  }

  get enableAgentRoute() {
    return this.digitsTriggerDetermineNextAgent !== '';
  }

  set enableAgentRoute(enb: boolean) {
    if (enb) {
      this.digitsTriggerDetermineNextAgent = '3';
    } else {
      this.digitsTriggerDetermineNextAgent = '';
    }
  }

  get mohConfig(): MohConfig {
    return new MohConfig(this.musicOnHold);
  }

  set mohConfig(cfg: MohConfig) {
    this.musicOnHold = cfg.xml();
  }
}

export class MaxWaitingTimeConfig {
  maxWaitingTime = -1;
  hangupMessage: string;
  action: string;

  get enabled(): boolean {
    if (this.maxWaitingTime > 0) {
      return true;
    }

    return false;
  }

  set enabled(enb: boolean) {
    if (enb) {
      this.maxWaitingTime = 30;
    } else {
      this.maxWaitingTime = -1;
    }
  }
}

export class FieldsConfig {
  fieldName: string;
  fieldValue = '';
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Transfer2GenieConfig {
  codeAuthen: string;
  skillId: string;
  path: string;
  fields: FieldsConfig[] = [];
  constructor(codeAuthen: string, obj?: any) {
    this.codeAuthen = codeAuthen;
    if (obj) {
      Object.assign(this, obj);
      this.fields = this.fields ? this.fields.map(x => new FieldsConfig(x)) : [];
    }
  }
}

export class QueueConfig {
  uuid: string;
  label: string;
  code: string;
  priority: number;
  slaThreshold: number;
  assignedAgents: AssignedAgent[] = [];
  agentWorkflowConfig: AgentWorkflowConfig;
  callflowConfig: CallflowConfig = new CallflowConfig();
  postCallConfig: PostCallConfig = new PostCallConfig();
  customFields: DetailCustomField[];
  outboundConcurrentCallLimit: number;
  thresholdConfigs: Thresholds;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.callflowConfig = new CallflowConfig(obj.callflowConfig);
      if (!obj?.thresholdConfigs) {
        this.thresholdConfigs = <Thresholds>{
          abandonedThreshold: null,
          outboundConcurrentCallLimit: null,
          slaThreshold: null
        };
      }
    }
  }
}

export interface Thresholds {
  abandonedThreshold: number;
  outboundConcurrentCallLimit: number;
  slaThreshold: number;
}

export class QueueInfo {
  uuid: string;
  label: string;
  code: string;
  priority: number;
  slaThreshold: number;
  assignedAgents: string[];
  codeOptions: string[];
  script: string;
  numberOfAssignedAgents: number;
  outboundConcurrentCallLimit: number;
  relatedCampaigns?: CampaignInfo[];
  callflowConfig: CallflowConfig = new CallflowConfig();
  postCallConfig: PostCallConfig = new PostCallConfig();

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.postCallConfig = new PostCallConfig(obj.postCallConfig);
    }
  }
}

export class CreateRequest {
  clonedQueue: QueueInfo;
  label: string;
  genieCode?: string;

  constructor(queue: QueueInfo) {
    this.clonedQueue = queue;
  }
}

export class VoicemailConfig {
  message: string;
  isEnabledSendToEmail: boolean;
  emails: string[];
  s3Key: string;
  type: TTSType;
  url: string;

  get voiceMailMessageConfig(): TtsConfig {
    return new TtsConfig(this.message);
  }

  set voiceMailMessageConfig(cfg: TtsConfig) {
    this.message = cfg.xml();
  }

  constructor(obj?: Partial<VoicemailConfig>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface DetailCustomField {
  key: string;
  type: TypeCustomField;
  options: string[];
  // ui
  value: string | string[];
}

export enum TypeCustomField {
  textField = 'textField',
  numberField = 'numberField',
  singleChoiceField = 'singleChoiceField',
  multipleChoiceField = 'multipleChoiceField'
}
