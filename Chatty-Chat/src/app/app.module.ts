// standard imports
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

// material imports
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatProgressSpinnerModule } from '@angular/material';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconRegistry, MatIconModule } from '@angular/material';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DomSanitizer } from '@angular/platform-browser';

// custom components
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { NewDialogComponent } from './new-dialog/new-dialog.component';
import { NewUserDialogComponent } from './new-user-dialog/new-user-dialog.component';
import { ManageUsersDialogComponent } from './manage-users-dialog/manage-users-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    DeleteDialogComponent,
    NewDialogComponent,
    NewUserDialogComponent,
    ManageUsersDialogComponent
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
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    HttpClientModule,
    RouterModule.forRoot([
      {'path': '', 'component': LoginComponent},
      {'path': 'dash', 'component': DashboardComponent},
    ])
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeleteDialogComponent, NewDialogComponent, NewUserDialogComponent, ManageUsersDialogComponent],
})
export class AppModule {
  constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer){
    matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('/assets/mdi.svg'));
  }
}
