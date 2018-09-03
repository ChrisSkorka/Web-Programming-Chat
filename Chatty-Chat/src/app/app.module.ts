import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatProgressSpinnerModule } from '@angular/material';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconRegistry, MatIconModule } from '@angular/material';
import { MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { NewDialogComponent } from './new-dialog/new-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    DeleteDialogComponent,
    NewDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatIconModule,
    MatDialogModule,
    HttpClientModule,
    RouterModule.forRoot([
      {'path': '', 'component': LoginComponent},
      {'path': 'dash/:userID', 'component': DashboardComponent},
    ])
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeleteDialogComponent],
})
export class AppModule {
  constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer){
    matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('/assets/mdi.svg'));
  }
}
