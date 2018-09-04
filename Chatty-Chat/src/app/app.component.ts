import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(private router:Router) {
    
  }

  // check id user id is set
  ngOnInit() {
    let userID = localStorage.getItem('userID');
    if(userID == null) // if no user set, redirect to login
      this.router.navigate(['login']);
    else // if user is set redirect to dash
      this.router.navigate(['dash']);
  }

  
}
