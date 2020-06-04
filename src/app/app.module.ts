import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';

import { AppComponent } from './app.component';
import {environment} from '../environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import {FilelistComponent} from './filelist/filelist.component';
import { EditorComponent } from './editor/editor.component';
import { FrontpageComponent } from './frontpage/frontpage.component';
import { AppRoutingModule } from './app-routing.module';
import {CreateNoteDialog, ZettelkastenComponent} from './zettelkasten/zettelkasten.component'; // Added here
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { IonicModule } from '@ionic/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatRippleModule} from '@angular/material/core';
import {MatDialogModule} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { GraphComponent } from './graph/graph.component';
import {MatDividerModule} from '@angular/material/divider';
import {AngularSplitModule} from 'angular-split';
import { SearchDialogComponent } from './search-dialog/search-dialog.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatListModule} from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import { DndDirective } from './dnd.directive';
import {AngularFireStorageModule} from '@angular/fire/storage';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {HttpClientModule} from '@angular/common/http';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
  entryComponents: [CreateNoteDialog], // Not declared in template to must be here
  declarations: [
    AppComponent,
    FilelistComponent,
    EditorComponent,
    FrontpageComponent,
    ZettelkastenComponent,
    CreateNoteDialog,
    GraphComponent,
    SearchDialogComponent,
    DndDirective,
    SettingsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule,
    AngularSplitModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    FormsModule,
    HttpClientModule,
    IonicModule.forRoot(),
    BrowserAnimationsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatRippleModule,
    MatDialogModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }