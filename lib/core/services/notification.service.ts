/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, MatSnackBarConfig } from '@angular/material';
import { TranslationService } from './translation.service';
import { AppConfigService, AppConfigValues } from '../app-config/app-config.service';
import { Subject } from 'rxjs';
import { NotificationModel } from '../models/notification.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    DEFAULT_DURATION_MESSAGE: number = 5000;

    messages: Subject<NotificationModel> = new Subject();

    constructor(private snackBar: MatSnackBar,
                private translationService: TranslationService,
                private appConfigService: AppConfigService) {
        this.DEFAULT_DURATION_MESSAGE = this.appConfigService.get<number>(AppConfigValues.NOTIFY_DURATION) || this.DEFAULT_DURATION_MESSAGE;

    }

    /**
     * Opens a SnackBar notification to show a message.
     * @param message The message (or resource key) to show.
     * @param translationArgs The interpolation parameters to add for the translation
     * @param config Time before notification disappears after being shown or MatSnackBarConfig object
     * @returns Information/control object for the SnackBar
     */
    openSnackMessage(message: string, config?: number | MatSnackBarConfig, translationArgs?: any): MatSnackBarRef<any> {
        const translatedMessage = this.translationService.instant(message, translationArgs);
        return this.performOpening(translatedMessage, config);
    }

    private performOpening(translatedMessage: string, config?: number | MatSnackBarConfig): MatSnackBarRef<any> {
        if (!config) {
            config = this.DEFAULT_DURATION_MESSAGE;
        }

        if (typeof config === 'number') {
            config = {
                duration: config
            };
        }
        this.messages.next({ message: translatedMessage, dateTime: new Date });

        return this.snackBar.open(translatedMessage, null, config);
    }

    /**
     * Opens a SnackBar notification with a message and a response button.
     * @param message The message (or resource key) to show.
     * @param action Caption for the response button
     * @param config Time before notification disappears after being shown or MatSnackBarConfig object
     * @returns Information/control object for the SnackBar
     */
    openSnackMessageAction(message: string, action: string, config?: number | MatSnackBarConfig): MatSnackBarRef<any> {
        if (!config) {
            config = this.DEFAULT_DURATION_MESSAGE;
        }

        const translatedMessage = this.translationService.instant(message);

        if (typeof config === 'number') {
            config = {
                duration: config
            };
        }

        this.messages.next({ message: translatedMessage, dateTime: new Date });

        return this.snackBar.open(translatedMessage, action, config);
    }

    /**
     *  dismiss the notification snackbar
     */
    dismissSnackMessageAction() {
        return this.snackBar.dismiss();
    }

    protected showMessage(message: string, panelClass: string, action?: string, interpolateArgs?: any): MatSnackBarRef<any> {
        message = this.translationService.instant(message, interpolateArgs);
        return this.openMessageBar(message, panelClass, action);
    }

    private openMessageBar(message: string, panelClass: string, action?: string):  MatSnackBarRef<any> {
        this.messages.next({ message: message, dateTime: new Date });

        return this.snackBar.open(message, action, {
            duration: this.DEFAULT_DURATION_MESSAGE,
            panelClass
        });
    }

    /**
     * Rase error message
     * @param message Text message or translation key for the message.
     * @param action Action name
     */
    showError(message: string, action?: string): MatSnackBarRef<any> {
        return this.showMessage(message, 'adf-error-snackbar', action);
    }

    /**
     * Rase info message
     * @param message Text message or translation key for the message.
     * @param action Action name
     */
    showInfo(message: string, action?: string, interpolateArgs?: any): MatSnackBarRef<any> {
        return this.showMessage(message, 'adf-info-snackbar', action, interpolateArgs);
    }

    /**
     * Rase warning message
     * @param message Text message or translation key for the message.
     * @param action Action name
     */
    showWarning(message: string, action?: string): MatSnackBarRef<any> {
        return this.showMessage(message, 'adf-warning-snackbar', action);
    }
}
