import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { DashboardType } from '../dashboard/dashboard.model';
import { Question } from './question.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  constructor(private http: HttpClient) {}

  create(question: Question) {
    return this.http.post<Question>(`dashboard/private/v1/questions`, question).pipe(map(qu => Question.fromResp(qu)));
  }

  fetchAll(dashboardType: DashboardType) {
    const params = {
      service: dashboardType
    };
    return this.http
      .get<Question[]>(`dashboard/private/v1/questions`, { params: params })
      .pipe(map(list => list.map(qu => Question.fromResp(qu))));
  }

  getOne(uuid: string) {
    return this.http
      .get<Question>(`dashboard/private/v1/questions/${uuid}`)
      .pipe(map(question => Question.fromResp(question)));
  }

  update(question: Question) {
    return this.http
      .put<Question>(`dashboard/private/v1/questions/${question.uuid}`, question)
      .pipe(map(resp => Question.fromResp(resp)));
  }

  delete(question: Question) {
    return this.http.delete<void>(`dashboard/private/v1/dashboards/${question.uuid}`);
  }
}
