import { Component, OnInit } from '@angular/core';
//import {FormControl, Validators} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  signinInProcess:boolean = false;
  username:string = '';
  password:string = '';
  invalidUsername:boolean = false;
  invalidPassword:boolean = false;

  constructor(private router:Router){}

  ngOnInit() {
  }

  // @Output() onAuthorised: EventEmitter<null> = new EventEmitter();

  autherise(){
    //this.onAuthorised.emit();
    this.router.navigateByUrl("/dash");
  }

  // usernameFormControl = new FormControl('', [
  //   (fc: FormControl) => {this.test = fc.value;return this.invalidUsername ? {
  //     validatePattern: {
  //       valid: true
  //     }
  //   } : null;},
  // ]);

  signin(event){
    //event.preventDefault();

    this.signinInProcess = true;
    if(this.username == 'TechSupport420'){
      this.invalidUsername = false;
      //this.usernameFormControl.setErrors('', {emitEvent: true});
      if(this.password == 'password'){
        this.invalidPassword = false;

        this.autherise();

      }else{ // password doesnt match
        this.signinInProcess = false;
        this.invalidPassword = true;
      }

    }else{ // user doesnt exists
      this.signinInProcess = false;
      this.invalidUsername = true;
      //this.usernameFormControl.setErrors('', {emitEvent: true});
    }

  }

}
