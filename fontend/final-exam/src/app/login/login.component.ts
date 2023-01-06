import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTE_LINK } from '../common/contants';
import { AccountService } from '../common/service/account.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  showErrorSummary = false;
  indicator = false;
  loginSuccess: boolean;

  @Input() error: string;

  @Output() submitEM = new EventEmitter();

  get username(): FormControl {
    return this.loginForm.get('username') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  getErrorCredential() {
    return this.username.hasError('required') ? 'Please enter your email or number' : '';
  }

  getErrorPassword() {
    return this.password.hasError('required') ? 'Please enter your password' : '';
  }
  constructor(private fb: FormBuilder, private accountService: AccountService) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  showRememberMe() {
    return location.hostname !== '???';
  }

  submit() {
    if (this.loginForm.valid) {
      if(this.username.value == 'TestUser' && this.password.value == '123456') {
        this.loginSuccess = true;
        this.accountService.createAuthorizationHeader(this.username.value, this.password.value)
      } else {
        this.loginSuccess = false;
      }

      this.submitEM.emit(this.loginSuccess);

    }
  }

  removeReadonlyAttr(input: HTMLInputElement) {
    input.removeAttribute('readonly');
  }

}
