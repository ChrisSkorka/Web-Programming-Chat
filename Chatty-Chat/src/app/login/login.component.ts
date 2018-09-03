import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

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

  constructor(private router:Router, private http: HttpClient, private dialog: MatDialog){}

  ngOnInit() {
  }

  // @Output() onAuthorised: EventEmitter<null> = new EventEmitter();

  autherise(userID:number){
    //this.onAuthorised.emit();
    localStorage.setItem('userID', userID.toString());
    this.router.navigate(['/dash']);
  }

  signin(event){
    //event.preventDefault();

    // show loading circle
    this.signinInProcess = true;

    //send username to server for checking
    this.http.post(
      'http://localhost:3000/login', 
      {username:this.username, password:this.password}
    ).subscribe(
      (res:any) => {
        console.log(res);
        if(res.error == null){
          this.autherise(res.data);
        }else{
          alert(res.error);
          this.signinInProcess = false;
        }
      },
      err => {
        alert("Error connecting to the server");
      }
    );
  }


}
