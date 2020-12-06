import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {NoteService} from '../note.service';
import {Flashcard} from '../types';
import {Subscription} from 'rxjs';
import {SettingsService} from '../settings.service';
import {FlashcardService} from '../flashcard.service';
import {SubviewManagerService} from '../subview-manager.service';
import * as marked from 'marked';
import {DomSanitizer} from '@angular/platform-browser';
import {FlashcardDialogComponent, FlashcardDialogData} from '../create-flashcard-dialog/flashcard-dialog.component';
import {MatDialog} from '@angular/material/dialog';

const DUE_FCS_QUEUE_NAME = 'due flashcards';
const ALL_FCS_QUEUE_NAME = 'all flashcards';

@Component({
  selector: 'app-study',
  template: `
    <div id="top-bar">
      <span><!-- this element is for centering the dropdown --></span>
      <mat-form-field id="queue-dropdown" appearance="fill">
        <mat-label>Flashcard queue</mat-label>
        <mat-select [(value)]="selectedQueue" (selectionChange)="queueChanged()">
          <span class="queue-option-container" *ngFor="let queue of fcQueues">
            <mat-option [value]="queue[0]">
              <span class="queue-info-container">
                <span class="queue-name">{{queue[0]}}</span>
              </span>
            </mat-option>
            <span class="due-count">{{dueFcQueues.get(queue[0])?.length || 0}}/{{queue[1]?.length || 0}} due</span>
          </span>
        </mat-select>
      </mat-form-field>
      <button mat-button (click)="closeView()" matTooltip="close view">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div id="container">
      <button mat-button id="more-button" [matMenuTriggerFor]="optionsMenu">
        <mat-icon>more_vert</mat-icon>
        <mat-menu #optionsMenu="matMenu">
          <button (click)="editFlashcard(displayedFc)" mat-menu-item matTooltip="edit flashcard">
            <mat-icon>edit</mat-icon>
            edit
          </button>
          <button (click)="deleteFlashcard(displayedFc.id)" mat-menu-item matTooltip="delete flashcard">
            <mat-icon>delete_outline</mat-icon>
            delete
          </button>
        </mat-menu>
      </button>
      <div id="fc-container">
        <div *ngIf="allFcs.length === 0">You haven't created any flashcards.</div>
        <div *ngIf="allFcs.length > 0 && dueFcsQueue.length === 0">
          All done!
        </div>
        <div id="tags">
          <span *ngFor="let tag of displayedFc?.tags">{{tag}}</span>
        </div>
        <div id="due-fcs-container" class="raisedbox" [hidden]="!displayedFc">
          <div class="fc-side" #front [hidden]="revealed">{{displayedFc?.side1}}</div>
          <div class="fc-side" #back [hidden]="!revealed">{{displayedFc?.side2}}</div>
          <button mat-button *ngIf="!revealed" (click)="reveal()">show answer</button>
          <ng-container *ngIf="revealed">
            <div id="rating-container">
              <button mat-button (click)="submitRating(3, displayedFc)" matTooltip="Remembering was easy">Easy</button>
              <button mat-button (click)="submitRating(2, displayedFc)" matTooltip="Remembering was not easy, not hard">Moderate</button>
              <button mat-button (click)="submitRating(1, displayedFc)" matTooltip="Remembering was hard or incomplete">Hard</button>
              <button mat-button (click)="submitRating(0, displayedFc)" matTooltip="Couldn't remember">No idea</button>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      background: var(--primary-background-color);
      display: flex;
      flex-direction: column;
      justify-content: space-around;
    }

    #more-button {
      position: absolute;
      right: 0;
    }

    #container {
      position: relative;
    }

    .queue-option-container {
      align-items: center;
      display: flex;
      position: relative;
    }

    .queue-option-container mat-option {
      display: inline-block;
      flex-grow: 1;
    }

    #top-bar {
      display: flex;
      justify-content: space-between;
      height: var(--top-bar-height);
      background: var(--secondary-background-color);
      border-bottom: 1px solid var(--gutter-color);
    }

    #due-fcs-container {
      border-radius: 6px;
      box-shadow: 0 0 10px #bdbdbd;
      display: flex;
      flex-direction: column;
      width: 350px;
      /*min-height: 500px;*/
      padding: 10px;
    }

    #queue-dropdown {
      margin-left: 60px;
      max-width: 350px;
    }

    #rating-container {
      display: flex;
      justify-content: space-between;
    }

    #rating-container > button {
      flex-grow: 1;
    }

    #fc-container {
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
    }

    .due-count {
      color: var(--low-contrast-text-color);
      position: absolute;
      right: 5px;
    }

    .queue-info-container {
      display: flex;
      justify-content: space-between;
    }

    #tags {
      margin: 20px 0;
    }
  `]
})
export class StudyComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('front') front: ElementRef;
  @ViewChild('back') back: ElementRef;

  displayedFc?: Flashcard;
  revealed: boolean;
  allFcs: Flashcard[] = [];
  dueFcsQueue: Flashcard[] = [];
  fcQueues: [string, Flashcard[]][];
  dueFcQueues: Map<string, Flashcard[]>;
  numDueFcs: Map<string, number>;
  selectedQueue = DUE_FCS_QUEUE_NAME;

  private sub: Subscription;

  constructor(
      private readonly noteService: NoteService,
      private readonly flashcardService: FlashcardService,
      private readonly settings: SettingsService,
      private readonly subviewManager: SubviewManagerService,
      private sanitizer: DomSanitizer,
      private dialog: MatDialog) {
  }

  ngAfterViewInit() {
    this.sub = this.flashcardService.flashcards.subscribe(fcs => {
      if (!fcs) {
        return;
      }
      this.dueFcQueues = this.getQueueToDueFcs(fcs);
      this.allFcs = fcs;
      this.dueFcsQueue = this.flashcardService.getDueFlashcards();
      // Present first note automatically
      this.setNextFlashcard();
    });
  }

  queueChanged() {
    this.dueFcsQueue = this.dueFcQueues.get(this.selectedQueue);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  reveal() {
    this.revealed = true;
  }

  setNextFlashcard() {
    this.revealed = false;
    this.dueFcsQueue = this.dueFcQueues.get(this.selectedQueue);
    if (this.dueFcsQueue.length === 0) {
      return;
    }
    this.displayedFc = this.dueFcsQueue[0];

    // Set rendered contents
    const side1UnsafeContent = (marked as any)(this.displayedFc.side1);
    const side1SanitizedContent = this.sanitizer.sanitize(SecurityContext.HTML, side1UnsafeContent);
    this.front.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, side1SanitizedContent);
    const side2UnsafeContent = (marked as any)(this.displayedFc.side2);
    const side2SanitizedContent = this.sanitizer.sanitize(SecurityContext.HTML, side2UnsafeContent);
    this.back.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, side2SanitizedContent);
  }

  submitRating(rating: number, fc: Flashcard) {
    this.flashcardService.submitFlashcardRating(rating, fc);
    this.dueFcsQueue = this.dueFcsQueue.slice(1);
    if (rating === 0) {
      // If user couldn't remember the card at all it re-enters queue
      this.dueFcsQueue.push(fc);
    }
    this.setNextFlashcard();
  }

  closeView() {
    this.subviewManager.closeView('flashcard');
  }

  deleteFlashcard(id: string) {
    const result = window.confirm(`Delete this flashcard?`);
    if (result) {
      this.noteService.deleteFlashcard(id);
    }
  }

  editFlashcard(fc: Flashcard) {
    this.dialog.open(FlashcardDialogComponent, {
      position: { top: '10px' },
      data: {
        flashcardToEdit: fc
      } as FlashcardDialogData,
      width: '100%',
    });
  }

  private getQueueToDueFcs(fcs: Flashcard[]) {
    const queueToFcs = new Map<string, Flashcard[]>();
    const queueToDueFcs = new Map<string, Flashcard[]>();
    const dueFcs: Flashcard[] = [];
    const allFcs: Flashcard[] = [];
    for (const fc of fcs) {
      for (const tag of fc.tags) {
        if (!queueToFcs.has(tag)) {
          queueToFcs.set(tag, []);
        }
        queueToFcs.get(tag).push(fc);
        allFcs.push(fc);
        if (this.flashcardService.isDue(fc)) {
          if (!queueToDueFcs.has(tag)) {
            queueToDueFcs.set(tag, []);
          }
          queueToDueFcs.get(tag).push(fc);
          dueFcs.push(fc);
        }
      }
    }
    this.fcQueues = [
      [DUE_FCS_QUEUE_NAME, dueFcs],
      [ALL_FCS_QUEUE_NAME, allFcs],
      ...queueToFcs.entries(),
    ];
    queueToDueFcs.set(DUE_FCS_QUEUE_NAME, dueFcs);
    queueToDueFcs.set(ALL_FCS_QUEUE_NAME, dueFcs);
    return queueToDueFcs;
  }
}
