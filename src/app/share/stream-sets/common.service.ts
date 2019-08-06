import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class CommonService {
    activeConfigInfo;
    saveOperationInProgress = 0;
    unloadMessage = '修改还未保存，确认离开吗';
    errors = [];
    constructor() {
        window.onbeforeunload = (event) => {
            // Check if there was any change, if no changes, then simply let the user leave

            if (this.saveOperationInProgress <= 0) {
                return;
            }

            if (typeof event === 'undefined') {
                event = window.event;
            }
            if (event) {
                event.returnValue = this.unloadMessage;
            }
            return  this.unloadMessage;
        };
    }
}
