import { Pipe, PipeTransform } from '@angular/core';
import { BlockRef, BlockType, ConditionBranchType, GatherBranchType } from '@b3networks/api/ivr';
import { format, parse } from 'date-fns';
import * as _ from 'lodash';

@Pipe({
  name: 'branchLabel'
})
export class BranchLabelPipe implements PipeTransform {
  transform(nextBlockUuid: string, refs: BlockRef[], blockType: BlockType, triggerReloadBranchLabel: boolean): string {
    const branch = _.find(refs, (item: BlockRef) => {
      return item.nextBlockUuid === nextBlockUuid;
    });

    if (!branch) {
      return '';
    }

    if (blockType === BlockType.gather) {
      return this.constructGatherBranchLabel(branch);
    }

    if (blockType === BlockType.condition) {
      return this.constructConditionBranchLabel(branch);
    }

    if (blockType === BlockType.webhook) {
      return this.constructWebhookBranchLabel(branch);
    }

    return '';
  }

  private constructGatherBranchLabel(branch: any): string {
    if (branch.type === GatherBranchType[GatherBranchType.one]) {
      if (branch.digit === null || branch.digit === undefined) {
        return '';
      }

      return `Digit equals to ${branch.digit}`;
    }

    if (branch.type === GatherBranchType[GatherBranchType.any]) {
      if (branch.maxDigit === null || branch.maxDigit === undefined) {
        return '';
      }

      return `Any digit with max ${branch.maxDigit} digit(s)`;
    }

    if (branch.type === GatherBranchType[GatherBranchType.none]) {
      return `No digit`;
    }

    if (branch.type === GatherBranchType[GatherBranchType.multiple]) {
      return `Digit exists in upload file`;
    }

    if (branch.type === GatherBranchType[GatherBranchType.regex]) {
      return `Digit matches regex ${branch.digit} with max ${branch.maxDigit} digit(s)`;
    }

    return '';
  }

  private constructConditionBranchLabel(branch: any): string {
    let label = '';
    if (
      branch.type === ConditionBranchType[ConditionBranchType.callerIdPattern] &&
      branch.startWithList &&
      branch.startWithList.length > 0
    ) {
      label += `Caller number starts with ${branch.startWithList.join(',')}`;
      if (branch.lowerLength && branch.upperLength) {
        label += ` and has ${branch.lowerLength}-${branch.upperLength} numbers`;
      } else if (branch.lowerLength) {
        label += ` and has ${branch.lowerLength} numbers`;
      } else if (branch.upperLength) {
        label += ` and has ${branch.upperLength} numbers`;
      }
    }
    if (branch.type === ConditionBranchType[ConditionBranchType.dateInRange]) {
      if (branch.from && branch.to) {
        label += `Incoming call between ${format(
          parse(branch.from, 'MMM d HH:mm', new Date()),
          'MMM d HH:mm'
        )} and ${format(parse(branch.to, 'MMM d HH:mm', new Date()), 'MMM d HH:mm')}`;
      }
    }

    if (branch.type === ConditionBranchType[ConditionBranchType.timeInRange]) {
      if (branch.from && branch.to) {
        label += `Incoming call between ${format(parse(branch.from, 'HH:mm', new Date()), 'HH:mm')}
         and ${format(parse(branch.to, 'HH:mm', new Date()), 'HH:mm')}`;
      }
    }

    if (branch.type === ConditionBranchType[ConditionBranchType.dayOfWeek]) {
      if (branch.days && branch.days.length > 0) {
        label += `Incoming call on: ${branch.days.map(
          day => ' ' + day.charAt(0) + day.slice(1, day.length).toLowerCase()
        )}`;
      }
    }

    if (branch.type === ConditionBranchType[ConditionBranchType.callerIdInList]) {
      label += `Caller number exists in upload file`;
    }

    if (branch.type === ConditionBranchType.validateExpression) {
      label += `Expression template ${branch.expressionTemplate}`;
    }

    if (branch.type === ConditionBranchType[ConditionBranchType.otherwise]) {
      label += `Otherwise`;
    }

    return label;
  }

  private constructWebhookBranchLabel(branch: any): string {
    if (!branch.responseRegex) {
      return `All responses will be valid`;
    }

    return `Response matches ${branch.responseRegex}`;
  }
}
