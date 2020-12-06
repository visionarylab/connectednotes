import { Injectable } from '@angular/core';
import {sortAscByNumeric} from './utils';
import {Flashcard, FlashcardLearningData} from './types';
import {NoteService} from './note.service';
import {SettingsService} from './settings.service';
import {BehaviorSubject, interval} from 'rxjs';
import {debounce} from 'rxjs/operators';

export const INITIAL_FLASHCARD_LEARNING_DATA: FlashcardLearningData = Object.freeze({
  easinessFactor: 2.5,
  numRepetitions: 0,
  prevRepetitionEpochMillis: 0,
  prevRepetitionIntervalMillis: 0,
});

@Injectable({
  providedIn: 'root'
})
export class FlashcardService {

  flashcards: BehaviorSubject<Flashcard[]>;
  dueFlashcards = new BehaviorSubject<Flashcard[]>([]);
  numDueFlashcards = new BehaviorSubject<number>(0);

  // forTesting = {
  //   getNextRepetitionTimeEpochMillis: this.getNextRepetitionTimeEpochMillis
  // };

  constructor(private readonly noteService: NoteService, private readonly settings: SettingsService) {
    this.flashcards = this.noteService.flashcards;
    // weird pattern, should probably improve this
    const debouncedFcs = this.noteService.flashcards.pipe(debounce(() => interval(500)));
    debouncedFcs.subscribe(unused => {
      this.dueFlashcards.next(this.getDueFlashcards());
      this.numDueFlashcards.next(this.dueFlashcards.value.length);
    });
  }

  // Rating is between 0 and 3 where 0 is total blackout and 3 is total recall
  private static getNewEasinessFactor(previous: number, rating: number) {
    const newEasiness = previous - 0.8 + 0.28 * rating - 0.02 * Math.pow(rating, 2);
    return Math.max(1.3, newEasiness);
  }

  submitFlashcardRating(rating: number, fc: Flashcard) {
    const newLearningData = Object.assign({}, INITIAL_FLASHCARD_LEARNING_DATA);
    if (rating !== 0) {
      newLearningData.easinessFactor = FlashcardService.getNewEasinessFactor(fc.learningData.easinessFactor, rating);
      newLearningData.prevRepetitionIntervalMillis = new Date().getTime() - fc.learningData.prevRepetitionEpochMillis;
      newLearningData.prevRepetitionEpochMillis = new Date().getTime();
      newLearningData.numRepetitions++;
    }
    fc.learningData = newLearningData;
    return this.noteService.saveFlashcard(fc);
  }

  isDue(fc: Flashcard) {
    const curTime = new Date().getTime();
    return this.getNextRepetitionTimeEpochMillis(fc) < curTime;
  }

  getDueFlashcards() {
    const fcs = this.flashcards.value;
    const curTime = new Date().getTime();
    const activeFcs = fcs.filter(fc => curTime >= this.getNextRepetitionTimeEpochMillis(fc));
    sortAscByNumeric(activeFcs, fc => fc.learningData.prevRepetitionEpochMillis);
    return activeFcs;
  }

  private getNextRepetitionTimeEpochMillis(fc: Flashcard): number {
    const prevRepetitionIntervalMillis = fc.learningData.prevRepetitionIntervalMillis || 0;
    const prevRepetitionEpochMillis = fc.learningData.prevRepetitionEpochMillis || fc.createdEpochMillis;
    const {numRepetitions, easinessFactor} = fc.learningData;
    if (numRepetitions < this.settings.flashcardInitialDelayPeriod.value.length) {
      return prevRepetitionEpochMillis + this.settings.flashcardInitialDelayPeriod.value[numRepetitions];
    }
    const nextInterval = prevRepetitionIntervalMillis * easinessFactor;
    return prevRepetitionEpochMillis + nextInterval;
  }
}
