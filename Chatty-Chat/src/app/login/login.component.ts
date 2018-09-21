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

  // remove userId if present
  ngOnInit() {
    localStorage.removeItem('userID');
  }

  // store userID and navigate to dash
  autherise(userID:string){
    localStorage.setItem('userID', userID);
    this.router.navigate(['/dash']);
  }

  // signin process, sends login data to server. It recieves either a user token
  // or error message, if user token is recieved, store it and navigate to dash
  signin(event){

    // show loading circle
    this.signinInProcess = true;

    //send username to server for checking
    this.http.post(
      'http://localhost:3000/login', 
      {username:this.username, password:this.password}
    ).subscribe(
      (res:any) => {
        
        // if no error present, signin
        if(res.error == null){
          this.autherise(res.data);

        // if error present, show it
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
