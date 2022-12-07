import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

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
  constructor(private fb: FormBuilder) { }

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
      this.submitEM.emit(this.loginForm.value);
    }
  }

  removeReadonlyAttr(input: HTMLInputElement) {
    input.removeAttribute('readonly');
  }

}
