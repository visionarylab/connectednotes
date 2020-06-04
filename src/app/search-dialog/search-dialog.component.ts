import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {NoteService} from '../note.service';
import {HighlightedSegment, SearchResult} from '../types';

@Component({
  selector: 'app-search-dialog',
  template: `
    <mat-form-field>
      <mat-label>File search</mat-label>
      <input matInput [(ngModel)]="noteTitle" (keyup.enter)="close()" (keyup)="searchTermChanged($event)">
    </mat-form-field>
    <div id="results-container">
      <button class="result-link"
              [class.mat-button-toggle-checked]="idx==selectedListIndex"
              *ngFor="let result of this.searchResults; let idx = index"
              mat-button>
        <span [ngClass]="segment.highlighted ? 'highlighted' : ''" *ngFor="let segment of result.segments">{{segment.text}}</span>
      </button>
    </div>
  `,
  styles: [`
    .highlighted {
      background-color: yellow;
    }

    .result-link {
      display: block;
    }

    #results-container {
      align-items: stretch;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class SearchDialogComponent implements OnInit {

  noteTitle: string;
  searchResults: SearchResult[];

  selectedListIndex = 0;
  constructor(public dialogRef: MatDialogRef<SearchDialogComponent>, private readonly noteService: NoteService) {}

  close() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
  }

  searchTermChanged(e) {
    // TODO: out of bounds and list empty handling
    if (e.key === 'Enter') {
      const newNoteId = this.searchResults[this.selectedListIndex].noteId;
      this.noteService.selectNote(newNoteId);
      this.close();
    } else if (e.key === 'ArrowDown') {
      this.selectedListIndex = (this.selectedListIndex + 1) % this.searchResults.length;
    } else if (e.key === 'ArrowUp') {
      this.selectedListIndex = (this.selectedListIndex + this.searchResults.length - 1) % this.searchResults.length;
    } else if (this.noteTitle && this.noteTitle.length > 0) {
      this.selectedListIndex = 0;
      this.searchResults = this.searchForNotesByTitle(this.noteTitle);
    }
  }

  // Searches notes for the corresponding term. Just search titles for now.
  public searchForNotesByTitle(searchTerm: string): SearchResult[] {
    const notes = this.noteService.currentNotes;

    // First try full match.
    const matchingNotes = notes
      .filter(note => note.title.includes(searchTerm))
      .map(note => (
        {
          noteId: note.id,
          segments: this.splitToHighlightedParts(note.title, this.getIndicesCoveredByWords(note.title, [searchTerm]))
        })
      );

    // If we don't have that many full matches then try splitting the search term and checking the coverage
    if (matchingNotes.length < 5) {
      const splitTerms = searchTerm.split(' ').filter(term => term.length > 0);
      const alreadyAdded = new Set(matchingNotes.map(n => n.noteId));
      const notesWithAtLeastOneTerm = notes.filter(n => !alreadyAdded.has(n.id) && splitTerms.some(term => n.title.includes(term)));
      const highlightedTitleIndices = notesWithAtLeastOneTerm.map(note => this.getIndicesCoveredByWords(note.title, splitTerms));
      const trueCounts = highlightedTitleIndices.map(indices => indices.reduce((prev, cur) => cur ? prev + 1 : prev, 0));
      const trueCountPerLength = notesWithAtLeastOneTerm.map((note, idx) => trueCounts[idx] / note.title.length);
      const largestElementIndices = this.getLargestElementIndices(trueCountPerLength, 5);
      for (const idx of largestElementIndices) {
        const {id, title} = notesWithAtLeastOneTerm[idx];
        const searchRes = {
          noteId: id,
          segments: this.splitToHighlightedParts(title, highlightedTitleIndices[idx]),
        };
        matchingNotes.push(searchRes);
      }
    }
    return matchingNotes;
  }

  // Split given string to highlighted parts which are defined by the given boolean array, where 'true' corresponds to highlighted char.
  private splitToHighlightedParts(str: string, highlightedIndices: boolean[]): HighlightedSegment[] {
    const ans: HighlightedSegment[] = [];
    let subseqStartInx = 0;
    for (let i = 1; i < highlightedIndices.length; i++) {
      if (highlightedIndices[i] !== highlightedIndices[i - 1]) {
        const text = str.slice(subseqStartInx, i);
        ans.push({text, highlighted: highlightedIndices[subseqStartInx]});
        subseqStartInx = i;
      }
    }
    ans.push({text: str.slice(subseqStartInx), highlighted: highlightedIndices[subseqStartInx]});
    return ans;
  }

  // Returns the indices of the numbers that are among the 'numberOfLargestIndices' largest numbers in the given array.
  private getLargestElementIndices(arr: number[], numberOfLargestIndices: number) {
    const copy = arr.slice();
    // noooo you cant sort its nlogn and time complexity will suffer!!
    copy.sort((a, b) => b - a); // descending sort
    // haha sort goes brrrrrr
    const ans = [];
    for (let i = 0; i < Math.min(arr.length, numberOfLargestIndices); i++) {
      ans.push(arr.indexOf(copy[i]));
    }
    return ans;
  }

  // Returns the indices of the given string that are part of at least one of the
  // given words. For example, if the word is 'aabaa' and words is 'ba' returns
  // [false, false, true, true, false].
  private getIndicesCoveredByWords(str: string, words: string[]): boolean[] {
    const highlightIndices = new Array(str.length).fill(false);
    for (const term of words) {
      let occurrenceIdx = str.indexOf(term);
      while (occurrenceIdx !== -1) {
        for (let i = occurrenceIdx; i < occurrenceIdx + term.length; i++) {
          highlightIndices[i] = true;
        }
        occurrenceIdx = str.indexOf(term, occurrenceIdx + 1);
      }
    }
    return highlightIndices;
  }

}