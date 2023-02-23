import { Pipe, PipeTransform } from '@angular/core';
import { QuestionV2 } from '@b3networks/api/dashboard';
import { HashMap } from '@datorama/akita';

@Pipe({
  name: 'questionsName'
})
export class QuestionsNamePipe implements PipeTransform {
  transform(uuids: string[], questionsMap: HashMap<QuestionV2>): any {
    let value = '';
    uuids?.forEach(uuid => (value += !value ? questionsMap[uuid].name : `, ${questionsMap[uuid].name}`));
    return value;
  }
}
