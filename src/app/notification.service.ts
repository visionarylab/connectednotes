import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BackendStatusNotification} from './types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private unsavedChangedNotes = new BehaviorSubject<string[]>([]);
  private sidebarNotifications = new BehaviorSubject<BackendStatusNotification[]>([]);

  unsaved = this.unsavedChangedNotes.asObservable();
  sidebar = this.sidebarNotifications.asObservable();

  private clearStatusUpdateFns = new Map<string, number>();

  constructor() {}

  // Create notification to sidebar
  toSidebar(notificationId: string, message: string, removeAfterMillis?: number) {
    const cur = this.sidebarNotifications.value.find(status => status.id === notificationId);
    if (cur) {
      cur.message = message;
      // If there's already timeout we'll override it with this
      if (this.clearStatusUpdateFns.get(cur.id)) {
        const timeoutFnId = this.clearStatusUpdateFns.get(cur.id);
        clearTimeout(timeoutFnId);
      }
    } else {
      const newValue = this.sidebarNotifications.value; // TODO: is copy needed?
      newValue.push({id: notificationId, message});
      this.sidebarNotifications.next(newValue);
    }

    if (removeAfterMillis) {
      const timeoutFnId = setTimeout(() => {
        const newValue = this.sidebarNotifications.value.filter(s => s.id !== notificationId);
        this.sidebarNotifications.next(newValue);
        this.clearStatusUpdateFns.delete(notificationId);
      }, removeAfterMillis);
      this.clearStatusUpdateFns.set(notificationId, timeoutFnId);
    }
  }

  noteSaved(fileId: string) {
    const curValues = this.unsavedChangedNotes.value;
    const newValues = curValues.filter(noteId => noteId !== fileId);
    this.unsavedChangedNotes.next(newValues);
  }

  unsavedChanged(fileId: string) {
    const newValues = this.unsavedChangedNotes.value;
    newValues.push(fileId);
    this.unsavedChangedNotes.next(newValues);
  }
}