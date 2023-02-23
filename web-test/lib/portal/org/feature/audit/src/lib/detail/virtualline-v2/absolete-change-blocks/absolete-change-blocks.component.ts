import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuditData,
  Change,
  Condition,
  ExpectedResponse,
  Extensions,
  IvrBlock,
  IvrMsgConf,
  Retry,
  SSOData,
  TTSDetails,
  WebhookCommand
} from '@b3networks/api/audit';
import { AuditModalComponent } from '../../../common/audit-modal/audit-modal.component';
import { BaseAuditComponent } from '../../../common/base-audit.component';

@Component({
  selector: 'poa-absolete-change-blocks',
  templateUrl: './absolete-change-blocks.component.html',
  styleUrls: ['./absolete-change-blocks.component.scss']
})
export class AbsoleteChangeBlocksComponent extends BaseAuditComponent implements OnInit {
  columns = ['ipaddress', 'ipaddressValue', 'change', 'valueChange'];
  @Input() raw: any;
  mapAction = {
    add: 'Add block',
    delete: 'Delete block',
    edit: 'Edit block'
  };
  audit: AuditData;

  constructor(private dialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.audit = new AuditData();
    if (this.raw.clientInfo) {
      this.audit.ipAddress = this.raw.clientInfo.ipAddress;
    }

    try {
      this.audit.bizPhoneExtensions = this.raw.auditData.bizPhoneExtensions;
      this.audit.wallboardQueues = this.raw.auditData.wallboardQueues;
      this.audit.schedulerGroups = this.raw.auditData.schedulerGroups;
      this.audit.labelMap = this.raw.auditData.labelMap;

      const ivrBlock = this.raw.auditData.newBlock ? this.raw.auditData.newBlock : this.raw.auditData.oldBlock;
      this.audit.flowType = this.capitalize(ivrBlock.flowType.replace(/_/gm, ' '));
      this.audit.blockLabel = ivrBlock.label;
      this.audit.blockType = this.capitalize(ivrBlock.blockType);

      if (this.raw.auditData.action == 'ADD') {
        this.audit.action = 'Add block';
        this.generateChangeData(
          new IvrBlock({
            blockType: this.raw.auditData.newBlock.blockType,
            flowType: this.raw.auditData.newBlock.flowType,
            id: undefined,
            label: this.raw.auditData.newBlock.label
          }),
          this.raw.auditData.newBlock
        );
      } else if (this.raw.auditData.action == 'DELETE') {
        this.audit.action = 'Delete block';
      } else {
        this.audit.action = 'Edit block';
        this.generateChangeData(this.raw.auditData.oldBlock, this.raw.auditData.newBlock);
      }
    } catch (e) {
      console.error('Invalid audit data format');
    }
  }

  generateChangeData(oldBlock: IvrBlock, newBlock: IvrBlock) {
    if (this.isDifferent(oldBlock.nextStep, newBlock.nextStep)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Next block',
          oldValue: this.formatId(oldBlock.nextStep, this.audit),
          newValue: this.formatId(newBlock.nextStep, this.audit)
        })
      );
    }

    if (this.isDifferent(oldBlock.attempts, newBlock.attempts)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Play times',
          oldValue: this.formatNumber(oldBlock.attempts, 'times'),
          newValue: this.formatNumber(newBlock.attempts, 'times')
        })
      );
    }

    if (this.isDifferent(oldBlock.timeout, newBlock.timeout)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Caller input timeout',
          oldValue: this.formatNumber(oldBlock.timeout, 'seconds'),
          newValue: this.formatNumber(newBlock.timeout, 'seconds')
        })
      );
    }

    if (this.isDifferent(oldBlock.note, newBlock.note)) {
      this.audit.details.changeList.push(
        new Change({ name: 'Note', oldValue: oldBlock.note, newValue: newBlock.note })
      );
    }

    if (this.isDifferent(oldBlock.dest, newBlock.dest)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Transfer to',
          oldValue: this.formatDest(oldBlock.dest),
          newValue: this.formatDest(newBlock.dest)
        })
      );
    }

    if (this.isDifferent(oldBlock.displayCallee, newBlock.displayCallee)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Show as caller number with prefix',
          oldValue: this.formatBoolean(oldBlock.displayCallee),
          newValue: this.formatBoolean(newBlock.displayCallee)
        })
      );
    }

    if (this.isDifferent(oldBlock.emailTo, newBlock.emailTo)) {
      this.audit.details.changeList.push(
        new Change({ name: 'Email', oldValue: oldBlock.emailTo, newValue: newBlock.emailTo })
      );
    }

    if (this.isDifferent(oldBlock.smsTo, newBlock.smsTo)) {
      this.audit.details.changeList.push(
        new Change({ name: 'SMS', oldValue: oldBlock.smsTo, newValue: newBlock.smsTo })
      );
    }

    if (this.isDifferent(oldBlock.smsSender, newBlock.smsSender)) {
      this.audit.details.changeList.push(
        new Change({ name: 'Sender number', oldValue: oldBlock.smsSender, newValue: newBlock.smsSender })
      );
    }

    if (this.isDifferent(oldBlock.smsTemplate, newBlock.smsTemplate)) {
      this.audit.details.changeList.push(
        new Change({ name: 'SMS template', oldValue: oldBlock.smsTemplate, newValue: newBlock.smsTemplate })
      );
    }

    if (this.isDifferent(oldBlock.enableVoiceMail, newBlock.enableVoiceMail)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Enable voice mail',
          oldValue: this.formatBoolean(oldBlock.enableVoiceMail),
          newValue: this.formatBoolean(newBlock.enableVoiceMail)
        })
      );
    }

    if (this.isDifferent(oldBlock.enableMessage, newBlock.enableMessage)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Enable message',
          oldValue: this.formatBoolean(oldBlock.enableMessage),
          newValue: this.formatBoolean(newBlock.enableMessage)
        })
      );
    }

    if (this.isDifferent(oldBlock.toStep, newBlock.toStep)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Previous block',
          oldValue: this.formatId(oldBlock.toStep, this.audit),
          newValue: this.formatId(newBlock.toStep, this.audit)
        })
      );
    }

    if (this.isDifferent(oldBlock.goTimes, newBlock.goTimes)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Back times',
          oldValue: this.formatNumber(oldBlock.goTimes, ' times'),
          newValue: this.formatNumber(newBlock.goTimes, ' times')
        })
      );
    }

    if (this.isDifferent(oldBlock.ringTime, newBlock.ringTime)) {
      this.audit.details.changeList.push(
        new Change({
          name: 'Triggered after',
          oldValue: this.formatNumber(oldBlock.ringTime, ' seconds'),
          newValue: this.formatNumber(newBlock.ringTime, ' seconds')
        })
      );
    }

    if (this.isDifferent(JSON.stringify(oldBlock.data), JSON.stringify(newBlock.data))) {
      this.generateCustomData(oldBlock.data, newBlock.data);
    }

    try {
      oldBlock.command = !oldBlock.command ? new WebhookCommand() : oldBlock.command;
      newBlock.command = !newBlock.command ? new WebhookCommand() : newBlock.command;

      if (this.isDifferent(oldBlock.command.url, newBlock.command.url)) {
        this.audit.details.changeList.push(
          new Change({ name: 'URL', oldValue: oldBlock.command.url, newValue: newBlock.command.url })
        );
      }

      if (this.isDifferent(oldBlock.command.method, newBlock.command.method)) {
        this.audit.details.changeList.push(
          new Change({ name: 'Method', oldValue: oldBlock.command.method, newValue: newBlock.command.method })
        );
      }

      if (this.isDifferent(oldBlock.command.dataType, newBlock.command.dataType)) {
        this.audit.details.changeList.push(
          new Change({ name: 'Data type', oldValue: oldBlock.command.dataType, newValue: newBlock.command.dataType })
        );
      }

      this.generateParameterAndHeader(oldBlock.command.params, newBlock.command.params, false);
      this.generateParameterAndHeader(oldBlock.command.headers, newBlock.command.headers, true);
    } catch (e) {}

    try {
      oldBlock.ivrMsgConf = !oldBlock.ivrMsgConf ? new IvrMsgConf() : oldBlock.ivrMsgConf;
      newBlock.ivrMsgConf = !newBlock.ivrMsgConf ? new IvrMsgConf() : newBlock.ivrMsgConf;

      if (this.isDifferent(oldBlock.ivrMsgConf.languageCode, newBlock.ivrMsgConf.languageCode)) {
        this.audit.details.changeList.push(
          new Change({
            name: 'Language',
            oldValue: oldBlock.ivrMsgConf.languageCode,
            newValue: newBlock.ivrMsgConf.languageCode
          })
        );
      }

      this.generateIvrMessageData(oldBlock.ivrMsgConf.message, newBlock.ivrMsgConf.message);

      if (this.isDifferent(oldBlock.ivrMsgConf.playType, newBlock.ivrMsgConf.playType)) {
        this.audit.details.changeList.push(
          new Change({
            name: 'Text to speech',
            oldValue: this.formatBoolean(oldBlock.ivrMsgConf.playType == 'TTS'),
            newValue: this.formatBoolean(newBlock.ivrMsgConf.playType == 'TTS')
          })
        );
      }

      if (this.isDifferent(oldBlock.ivrMsgConf.mp3Url, newBlock.ivrMsgConf.mp3Url)) {
        this.audit.details.changeList.push(
          new Change({
            name: 'MP3',
            oldValue: this.formatMessage(oldBlock.ivrMsgConf.mp3Url),
            newValue: this.formatMessage(newBlock.ivrMsgConf.mp3Url)
          })
        );
      }
    } catch (e) {}

    switch (newBlock.blockType) {
      case 'GATHER':
        this.generateGatherData(oldBlock.extensions, newBlock.extensions);
        break;
      case 'CONDITION':
      case 'CUSTOM':
        this.generateConditionData(oldBlock.conditions, newBlock.conditions);
        break;
      case 'WEBHOOK':
        this.generateWebhookData(oldBlock.expectedResponses, newBlock.expectedResponses);
        break;
    }
  }

  generateCustomData(oldExtraData: SSOData, newExtraData: SSOData) {
    oldExtraData = !oldExtraData ? new SSOData() : oldExtraData;
    newExtraData = !newExtraData ? new SSOData() : newExtraData;

    if (this.isDifferent(oldExtraData.host, newExtraData.host)) {
      this.audit.details.changeList.push(
        new Change({ name: 'Host', oldValue: oldExtraData.host, newValue: newExtraData.host })
      );
    }

    const parts: number[] = [0, 1];
    for (const part of parts) {
      const step = Number(part) + 1;
      if (this.isDifferent(oldExtraData.maxDigits[part], newExtraData.maxDigits[part])) {
        this.audit.details.changeList.push(
          new Change({
            name: `Step ${step}: max digit`,
            oldValue: oldExtraData.maxDigits[part],
            newValue: newExtraData.maxDigits[part]
          })
        );
      }

      if (this.isDifferent(oldExtraData.timeouts[part], newExtraData.timeouts[part])) {
        this.audit.details.changeList.push(
          new Change({
            name: `Step ${step}: timeout`,
            oldValue: this.formatNumber(oldExtraData.timeouts[part], 'seconds'),
            newValue: this.formatNumber(newExtraData.timeouts[part], 'seconds')
          })
        );
      }

      try {
        const oldMessage: IvrMsgConf = !oldExtraData.messages[part] ? new IvrMsgConf() : oldExtraData.messages[part];
        const newMessage: IvrMsgConf = !newExtraData.messages[part] ? new IvrMsgConf() : newExtraData.messages[part];
        if (this.isDifferent(oldMessage.languageCode, newMessage.languageCode)) {
          this.audit.details.changeList.push(
            new Change({
              name: `Step ${step}: language`,
              oldValue: oldMessage.languageCode,
              newValue: newMessage.languageCode
            })
          );
        }

        this.generateIvrMessageData(oldMessage.message, newMessage.message, `Step ${step}: message`);

        if (this.isDifferent(oldMessage.playType, newMessage.playType)) {
          this.audit.details.changeList.push(
            new Change({
              name: `Step ${step}: text to speech`,
              oldValue: this.formatBoolean(oldMessage.playType == 'TTS'),
              newValue: this.formatBoolean(newMessage.playType == 'TTS')
            })
          );
        }

        if (this.isDifferent(oldMessage.mp3Url, newMessage.mp3Url)) {
          this.audit.details.changeList.push(
            new Change({
              name: `Step ${step}: mp3`,
              oldValue: this.formatMessage(oldMessage.mp3Url),
              newValue: this.formatMessage(newMessage.mp3Url)
            })
          );
        }
      } catch (e) {}

      if (this.isDifferent(oldExtraData.attempts[part], newExtraData.attempts[part])) {
        this.audit.details.changeList.push(
          new Change({
            name: `Step ${step}: play times`,
            oldValue: this.formatNumber(oldExtraData.attempts[part], 'times'),
            newValue: this.formatNumber(newExtraData.attempts[part], 'times')
          })
        );
      }
    }

    const retries: number[] = [0, 1];
    for (const part of retries) {
      const name = Number(part) == 0 ? 'Invalid OTP' : 'No OTP';
      const oldRetry: Retry = !oldExtraData.retries[part] ? new Retry() : oldExtraData.retries[part];
      const newRetry: Retry = !newExtraData.retries[part] ? new Retry() : newExtraData.retries[part];

      if (this.isDifferent(oldRetry.maxTimes, newRetry.maxTimes)) {
        this.audit.details.changeList.push(
          new Change({
            name: `${name}: retry times`,
            oldValue: this.formatNumber(oldRetry.maxTimes, 'times'),
            newValue: this.formatNumber(newRetry.maxTimes, 'times')
          })
        );
      }

      try {
        const oldRetryMessage: IvrMsgConf = !oldRetry.message ? new IvrMsgConf() : oldRetry.message;
        const newRetryMessage: IvrMsgConf = !newRetry.message ? new IvrMsgConf() : newRetry.message;
        if (this.isDifferent(oldRetryMessage.languageCode, newRetryMessage.languageCode)) {
          this.audit.details.changeList.push(
            new Change({
              name: `${name}: language`,
              oldValue: oldRetryMessage.languageCode,
              newValue: newRetryMessage.languageCode
            })
          );
        }

        this.generateIvrMessageData(oldRetryMessage.message, newRetryMessage.message, `${name}: retry message`);

        if (this.isDifferent(oldRetryMessage.playType, newRetryMessage.playType)) {
          this.audit.details.changeList.push(
            new Change({
              name: `${name}: text to speech`,
              oldValue: this.formatBoolean(oldRetryMessage.playType == 'TTS'),
              newValue: this.formatBoolean(newRetryMessage.playType == 'TTS')
            })
          );
        }

        if (this.isDifferent(oldRetryMessage.mp3Url, newRetryMessage.mp3Url)) {
          this.audit.details.changeList.push(
            new Change({
              name: `${name}: mp3`,
              oldValue: this.formatMessage(oldRetryMessage.mp3Url),
              newValue: this.formatMessage(newRetryMessage.mp3Url)
            })
          );
        }
      } catch (e) {}
    }
  }

  generateGatherData(oldExts: Extensions[], newExts: Extensions[]) {
    if (newExts.length >= oldExts.length) {
      for (const newExt of newExts) {
        const oldExt = oldExts.find(item => item.nextStep == newExt.nextStep);
        if (!oldExt) {
          this.audit.details.changeList.push(new Change({ name: 'Extension', oldValue: '', newValue: newExt.digits }));
          this.audit.details.changeList.push(
            new Change({ name: 'Max digit', oldValue: '', newValue: newExt.maxDigit + '' })
          );
          if (newExt.mappingUrl) {
            this.audit.details.changeList.push(new Change({ name: 'URL', oldValue: '', newValue: newExt.mappingUrl }));
          }
          if (newExt.needMonitor != undefined && newExt.needMonitor != null) {
            this.audit.details.changeList.push(
              new Change({ name: 'Monitor', oldValue: '', newValue: newExt.needMonitor })
            );
          }
          this.audit.details.changeList.push(
            new Change({ name: 'Next step', oldValue: '', newValue: this.formatId(newExt.nextStep, this.audit) })
          );
        } else {
          if (this.isDifferent(oldExt.digits, newExt.digits)) {
            this.audit.details.changeList.push(
              new Change({ name: 'Extension', oldValue: oldExt.digits, newValue: newExt.digits })
            );
          }

          if (this.isDifferent(oldExt.maxDigit, newExt.maxDigit)) {
            this.audit.details.changeList.push(
              new Change({ name: 'Max digit', oldValue: oldExt.maxDigit + '', newValue: newExt.maxDigit + '' })
            );
          }

          if (this.isDifferent(oldExt.mappingUrl, newExt.mappingUrl)) {
            this.audit.details.changeList.push(
              new Change({ name: 'URL', oldValue: oldExt.mappingUrl, newValue: newExt.mappingUrl })
            );
          }

          if (this.isDifferent(oldExt.needMonitor, newExt.needMonitor)) {
            this.audit.details.changeList.push(
              new Change({ name: 'Monitor', oldValue: oldExt.needMonitor, newValue: newExt.needMonitor })
            );
          }
        }
      }
    } else {
      for (const oldExt of oldExts) {
        const newExt = newExts.find(item => item.nextStep == oldExt.nextStep);
        if (!newExt) {
          this.audit.details.changeList.push(new Change({ name: 'Extension', oldValue: oldExt.digits, newValue: '' }));
          this.audit.details.changeList.push(
            new Change({ name: 'Max digit', oldValue: oldExt.maxDigit + '', newValue: '' })
          );
          if (oldExt.mappingUrl) {
            this.audit.details.changeList.push(new Change({ name: 'URL', oldValue: oldExt.mappingUrl, newValue: '' }));
          }
          if (oldExt.needMonitor != undefined && oldExt.needMonitor != null) {
            this.audit.details.changeList.push(
              new Change({ name: 'Monitor', oldValue: oldExt.needMonitor, newValue: '' })
            );
          }
          this.audit.details.changeList.push(
            new Change({ name: 'Next step', oldValue: this.formatId(oldExt.nextStep, this.audit), newValue: '' })
          );
        } else {
          if (this.isDifferent(oldExt.digits, newExt.digits)) {
            this.audit.details.changeList.push(
              new Change({ name: 'Extension', oldValue: oldExt.digits, newValue: newExt.digits })
            );
          }

          if (this.isDifferent(oldExt.maxDigit, newExt.maxDigit)) {
            this.audit.details.changeList.push(
              new Change({ name: 'Max digit', oldValue: oldExt.maxDigit + '', newValue: newExt.maxDigit + '' })
            );
          }

          if (this.isDifferent(oldExt.mappingUrl, newExt.mappingUrl)) {
            this.audit.details.changeList.push(
              new Change({ name: 'URL', oldValue: oldExt.mappingUrl, newValue: newExt.mappingUrl })
            );
          }

          if (this.isDifferent(oldExt.needMonitor, newExt.needMonitor)) {
            this.audit.details.changeList.push(
              new Change({ name: 'Monitor', oldValue: oldExt.needMonitor, newValue: newExt.needMonitor })
            );
          }
        }
      }
    }
  }

  generateConditionData(oldCons: Condition[], newCons: Condition[]) {
    if (newCons.length >= oldCons.length) {
      for (const newCon of newCons) {
        const oldCon = oldCons.find(item => item.nextStep == newCon.nextStep);
        if (!oldCon) {
          this.audit.details.changeList.push(
            new Change({
              name: 'Condition',
              oldValue: '',
              newValue: !newCon.condition ? 'Otherwise' : newCon.condition
            })
          );
          this.audit.details.changeList.push(
            new Change({ name: 'Next step', oldValue: '', newValue: this.formatId(newCon.nextStep, this.audit) })
          );
        } else {
          if (this.isDifferent(oldCon.condition, newCon.condition)) {
            this.audit.details.changeList.push(
              new Change({
                name: 'Condition',
                oldValue: !oldCon.condition ? 'Otherwise' : oldCon.condition,
                newValue: !newCon.condition ? 'Otherwise' : newCon.condition
              })
            );
          }
        }
      }
    } else {
      for (const oldCon of oldCons) {
        const newCon = newCons.find(item => item.nextStep == oldCon.nextStep);
        if (!newCon) {
          this.audit.details.changeList.push(
            new Change({
              name: 'Condition',
              oldValue: !oldCon.condition ? 'Otherwise' : oldCon.condition,
              newValue: ''
            })
          );
          this.audit.details.changeList.push(
            new Change({ name: 'Next step', oldValue: this.formatId(oldCon.nextStep, this.audit), newValue: '' })
          );
        } else {
          if (this.isDifferent(oldCon.condition, newCon.condition)) {
            this.audit.details.changeList.push(
              new Change({
                name: 'Condition',
                oldValue: !oldCon.condition ? 'Otherwise' : oldCon.condition,
                newValue: !newCon.condition ? 'Otherwise' : newCon.condition
              })
            );
          }
        }
      }
    }
  }

  generateWebhookData(oldRess: ExpectedResponse[], newRess: ExpectedResponse[]) {
    if (newRess.length >= oldRess.length) {
      for (const newRes of newRess) {
        const oldRes = oldRess.find(item => item.nextStep == newRes.nextStep);
        if (!oldRes) {
          this.audit.details.changeList.push(
            new Change({ name: 'Expected response', oldValue: '', newValue: newRes.expectedResponse })
          );
          this.audit.details.changeList.push(
            new Change({ name: 'Next step', oldValue: '', newValue: this.formatId(newRes.nextStep, this.audit) })
          );
        } else {
          if (this.isDifferent(oldRes.expectedResponse, newRes.expectedResponse)) {
            this.audit.details.changeList.push(
              new Change({
                name: 'Expected response',
                oldValue: oldRes.expectedResponse,
                newValue: newRes.expectedResponse
              })
            );
          }
        }
      }
    } else {
      for (const oldRes of oldRess) {
        const newRes = newRess.find(item => item.nextStep == oldRes.nextStep);
        if (!newRes) {
          this.audit.details.changeList.push(
            new Change({ name: 'Expected response', oldValue: oldRes.expectedResponse, newValue: '' })
          );
          this.audit.details.changeList.push(
            new Change({ name: 'Next step', oldValue: this.formatId(oldRes.nextStep, this.audit), newValue: '' })
          );
        } else {
          if (this.isDifferent(oldRes.expectedResponse, oldRes.expectedResponse)) {
            this.audit.details.changeList.push(
              new Change({
                name: 'Expected response',
                oldValue: oldRes.expectedResponse,
                newValue: newRes.expectedResponse
              })
            );
          }
        }
      }
    }
  }

  generateParameterAndHeader(oldParamOrHeader: any, newParamOrHeader: any, isHeader: boolean) {
    try {
      oldParamOrHeader = !oldParamOrHeader ? {} : oldParamOrHeader;
      newParamOrHeader = !newParamOrHeader ? {} : newParamOrHeader;

      const keys = Object.keys(oldParamOrHeader).concat(Object.keys(newParamOrHeader));
      keys.filter((value, index, self) => self.indexOf(value) == index);
      for (const key of keys) {
        const newValue = newParamOrHeader[key];
        const oldValue = oldParamOrHeader[key];
        if (this.isDifferent(oldValue, newValue)) {
          this.audit.details.changeList.push(
            new Change({
              name: isHeader ? 'Header' : 'Parameter',
              oldValue: this.formatParameterOrHeader(key, oldValue),
              newValue: this.formatParameterOrHeader(key, newValue)
            })
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  generateIvrMessageData(oldMessage: string, newMessage: string, fieldChangeName?: string) {
    if (this.isDifferent(oldMessage, newMessage)) {
      const oldTTSList: TTSDetails[] = this.parseTTSDetailsList(oldMessage);
      const newTTSList: TTSDetails[] = this.parseTTSDetailsList(newMessage);

      const loopAmount: number = oldTTSList.length > newTTSList.length ? oldTTSList.length : newTTSList.length;
      for (let i = 0; i < loopAmount; i++) {
        const oldTTS: TTSDetails = i < oldTTSList.length ? oldTTSList[i] : undefined;
        const newTTS: TTSDetails = i < newTTSList.length ? newTTSList[i] : undefined;
        if (this.isDifferentTTS(oldTTS, newTTS)) {
          this.audit.details.changeList.push(
            new Change({
              name: !fieldChangeName ? 'Message' : fieldChangeName,
              oldValue: this.constructTTSDetailsDisplayString(oldTTS),
              newValue: this.constructTTSDetailsDisplayString(newTTS)
            })
          );
        }
      }
    }
  }

  parseTTSDetailsList(message: string): TTSDetails[] {
    const result: TTSDetails[] = [];
    let regex = /<speech language="([^"]*?)"[^<]+>([\s\S]*?)<\/speech>/g;
    const matches = message.match(regex);
    if (matches) {
      for (const index of matches) {
        const pitchRegex = /pitch="([^"]*?)"/g;
        const rateRegex = /rate="([^"]*?)"/g;
        const voiceCodeRegex = /voice-code="([^"]*?)"/g;

        regex = /<speech language="([^"]*?)"[^<]+>([\s\S]*?)<\/speech>/g;
        const parts = regex.exec(matches[index]);
        const pitchParts = pitchRegex.exec(matches[index]);
        const rateParts = rateRegex.exec(matches[index]);
        const voiceCodeParts = voiceCodeRegex.exec(matches[index]);

        const tts = new TTSDetails({
          languageCode: parts[1],
          message: parts[2],
          pitch: !pitchParts ? undefined : pitchParts[1],
          rate: !rateParts ? undefined : rateParts[1],
          voiceCode: !voiceCodeParts ? undefined : voiceCodeParts[1]
        });
        result.push(tts);
      }
    }

    return result;
  }

  constructTTSDetailsDisplayString(ttsDetails: TTSDetails): string {
    if (!ttsDetails) {
      return undefined;
    }

    return `[languageCode="${ttsDetails.languageCode}", message="${ttsDetails.message}", pitch="${ttsDetails.pitch}", rate="${ttsDetails.rate}", voiceCode="${ttsDetails.voiceCode}"]`;
  }

  isDifferentTTS(oldTTS: TTSDetails, newTTS: TTSDetails): boolean {
    if (!oldTTS || !newTTS) {
      return true;
    }

    if (oldTTS.languageCode != newTTS.languageCode) {
      return true;
    }

    if (oldTTS.message != newTTS.message) {
      return true;
    }

    if (oldTTS.pitch != newTTS.pitch) {
      return true;
    }

    if (oldTTS.rate != newTTS.rate) {
      return true;
    }

    if (oldTTS.voiceCode != newTTS.voiceCode) {
      return true;
    }

    return false;
  }

  formatDest(dest: string) {
    if (!dest || dest.length == 0) {
      return undefined;
    }

    if (dest.indexOf('BP') >= 0) {
      const BPKey = dest.slice(dest.indexOf('|') + 1);
      if (BPKey == 'ALL') {
        return '#BizPhone(All extensions)';
      } else {
        const keys = BPKey.split(',');
        let result = `#BizPhone(${this.normalize(this.audit.bizPhoneExtensions[keys[0]])}`;
        for (let i = 1; i < keys.length; i++) {
          const label = this.normalize(this.audit.bizPhoneExtensions[keys[i]]);
          result += `, ${label}`;
        }
        result += ')';

        return result;
      }
    } else if (dest.indexOf('WB') >= 0) {
      const WBKey = dest.slice(dest.indexOf('|') + 1);
      const keys = WBKey.split(',');
      return `#Wallboard(${this.normalize(this.audit.wallboardQueues[keys[0]])})`;
    } else if (dest.indexOf('SD') >= 0) {
      const SDKey = dest.slice(dest.indexOf('|') + 1);
      const keys = SDKey.split(',');
      return `#Booking(${this.normalize(this.audit.schedulerGroups[keys[0]])})`;
    } else {
      return `#Number(${dest})`;
    }
  }

  formatParameterOrHeader(key: string, value: string) {
    if (!value) {
      return '-';
    } else {
      return `#${this.formatNullable(key)}(${this.formatNullable(value)})`;
    }
  }

  formatNullable(text: string) {
    if (!text) {
      return '-';
    } else {
      return text;
    }
  }

  showModelDetail() {
    const data = {
      details: this.audit.details.changeList,
      action: this.audit.action,
      mapAction: this.mapAction
    };
    this.dialog.open(AuditModalComponent, {
      width: '750px',
      data
    });
  }
}
