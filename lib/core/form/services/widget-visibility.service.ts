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

import { AlfrescoApiService } from '../../services/alfresco-api.service';
import { LogService } from '../../services/log.service';
import { Injectable } from '@angular/core';
import moment from 'moment-es6';
import { Observable, from, throwError } from 'rxjs';
import { FormFieldModel, FormModel, TabModel } from '../components/widgets/core/index';
import { TaskProcessVariableModel } from '../models/task-process-variable.model';
import { WidgetVisibilityModel, WidgetTypeEnum } from '../models/widget-visibility.model';
import { map, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class WidgetVisibilityService {

    private processVarList: TaskProcessVariableModel[];

    constructor(private apiService: AlfrescoApiService,
                private logService: LogService) {
    }

    public refreshVisibility(form: FormModel) {
        if (form && form.tabs && form.tabs.length > 0) {
            form.tabs.map((tabModel) => this.refreshEntityVisibility(tabModel));
        }

        if (form) {
            form.getFormFields().map((field) => this.refreshEntityVisibility(field));
        }
    }

    refreshEntityVisibility(element: FormFieldModel | TabModel) {
        const visible = this.evaluateVisibility(element.form, element.visibilityCondition);
        element.isVisible = visible;
    }

    evaluateVisibility(form: FormModel, visibilityObj: WidgetVisibilityModel): boolean {
        const isLeftFieldPresent = visibilityObj && (visibilityObj.leftType || visibilityObj.leftValue);
        if (!isLeftFieldPresent || isLeftFieldPresent === 'null') {
            return true;
        } else {
            return this.isFieldVisible(form, visibilityObj);
        }
    }

    isFieldVisible(form: FormModel, visibilityObj: WidgetVisibilityModel, accumulator: any[] = [], result: boolean = false): boolean {
        const leftValue = this.getLeftValue(form, visibilityObj);
        const rightValue = this.getRightValue(form, visibilityObj);
        const actualResult = this.evaluateCondition(leftValue, rightValue, visibilityObj.operator);

        if (this.isValidOperator(visibilityObj.nextConditionOperator)) {
            accumulator.push({ value: actualResult, operator: visibilityObj.nextConditionOperator });
        }

        if (this.isValidCondition(visibilityObj.nextCondition)) {
            result = this.isFieldVisible(form, visibilityObj.nextCondition, accumulator);
        } else if (accumulator[0] !== undefined) {
            result = accumulator[0].value;
            for (let i = 1; i < accumulator.length; i++) {
                if (accumulator[i] !== undefined) {
                    result = this.evaluateLogicalOperation(
                        accumulator[i - 1].operator,
                        result,
                        accumulator[i].value
                    );
                }
            }
        } else {
            result = actualResult;
        }
        return !!result;

    }

    getLeftValue(form: FormModel, visibilityObj: WidgetVisibilityModel): string {
        let leftValue = '';
        if (visibilityObj.leftType && visibilityObj.leftType === WidgetTypeEnum.variable) {
            leftValue = this.getVariableValue(form, visibilityObj.leftValue, this.processVarList);
        } else if (visibilityObj.leftType && visibilityObj.leftType === WidgetTypeEnum.field) {
            leftValue = this.getFormValue(form, visibilityObj.leftValue);
            if (leftValue === undefined || leftValue === '') {
                const variableValue = this.getVariableValue(form, visibilityObj.leftValue, this.processVarList);
                leftValue = !this.isInvalidValue(variableValue) ? variableValue : leftValue;
            }
        }
        return leftValue;
    }

    getRightValue(form: FormModel, visibilityObj: WidgetVisibilityModel): string {
        let valueFound = '';
        if (visibilityObj.rightType === WidgetTypeEnum.variable) {
            valueFound = this.getVariableValue(form, visibilityObj.rightValue, this.processVarList);
        } else if (visibilityObj.rightType === WidgetTypeEnum.field) {
            valueFound = this.getFormValue(form, visibilityObj.rightValue);
        } else {
            if (moment(visibilityObj.rightValue, 'YYYY-MM-DD', true).isValid()) {
                valueFound = visibilityObj.rightValue + 'T00:00:00.000Z';
            } else {
                valueFound = visibilityObj.rightValue;
            }
        }
        return valueFound;
    }

    getFormValue(form: FormModel, fieldId: string): any {
        let value = this.getFieldValue(form.values, fieldId);

        if (this.isInvalidValue(value)) {
            value = this.searchValueInForm(form, fieldId);
        }
        return value;
    }

    getFieldValue(valueList: any, fieldId: string): any {
        let dropDownFilterByName, valueFound;
        if (fieldId && fieldId.indexOf('_LABEL') > 0) {
            dropDownFilterByName = fieldId.substring(0, fieldId.length - 6);
            if (valueList[dropDownFilterByName]) {
                valueFound = valueList[dropDownFilterByName].name;
            }
        } else if (valueList[fieldId] && valueList[fieldId].id) {
            valueFound = valueList[fieldId].id;
        } else {
            valueFound = valueList[fieldId];
        }
        return valueFound;
    }

    private isInvalidValue(value: any): boolean {
        return value === undefined || value === null;
    }

    searchValueInForm(form: FormModel, fieldId: string): string {
        let fieldValue = '';
        form.getFormFields().forEach((formField: FormFieldModel) => {
            if (this.isSearchedField(formField, fieldId)) {
                fieldValue = this.getObjectValue(formField, fieldId);
                if (!fieldValue) {
                    if (formField.value && formField.value.id) {
                        fieldValue = formField.value.id;
                    } else if (!this.isInvalidValue(formField.value)) {
                        fieldValue = formField.value;
                    }
                }
            }
        });
        return fieldValue;
    }

    private getObjectValue(field: FormFieldModel, fieldId: string): string {
        let value = '';
        if (field.value && field.value.name) {
            value = field.value.name;
        } else if (field.options) {
            const option = field.options.find((opt) => opt.id === field.value);
            if (option) {
                value = this.getValueFromOption(fieldId, option);
            }
        }
        return value;
    }

    private getValueFromOption(fieldId: string, option): string {
        let optionValue = '';
        if (fieldId && fieldId.indexOf('_LABEL') > 0) {
            optionValue = option.name;
        } else {
            optionValue = option.id;
        }
        return optionValue;
    }

    private isSearchedField(field: FormFieldModel, fieldToFind: string): boolean {
        return (field.id && fieldToFind) ? field.id.toUpperCase() === fieldToFind.toUpperCase() : false;
    }

    getVariableValue(form: FormModel, name: string, processVarList: TaskProcessVariableModel[]): string {
        const processVariableValue = this.getProcessVariableValue(name, processVarList);
        const variableDefaultValue = this.getFormVariableDefaultValue(form, name);
        return (processVariableValue === undefined) ? variableDefaultValue : processVariableValue;
    }

    private getFormVariableDefaultValue(form: FormModel, identifier: string): string {
        const variables = this.getFormVariables(form);
        if (variables) {
            const formVariable = variables.find((formVar) => {
                return formVar.name === identifier || formVar.id === identifier;
            });

            let value;
            if (formVariable) {
                value = formVariable.value;
                if (formVariable.type === 'date') {
                    value += 'T00:00:00.000Z';
                }
            }
            return value;
        }
    }

    private getFormVariables(form: FormModel): any[] {
        return  form.json.variables;
    }

    private getProcessVariableValue(name: string, processVarList: TaskProcessVariableModel[]): string {
        if (processVarList) {
            const processVariable = processVarList.find((variable) => variable.id === name);
            if (processVariable) {
                return processVariable.value;
            }
        }

    }

    evaluateLogicalOperation(logicOp, previousValue, newValue): boolean {
        switch (logicOp) {
            case 'and':
                return previousValue && newValue;
            case 'or' :
                return previousValue || newValue;
            case 'and-not':
                return previousValue && !newValue;
            case 'or-not':
                return previousValue || !newValue;
            default:
                this.logService.error('NO valid operation! wrong op request : ' + logicOp);
                break;
        }
    }

    evaluateCondition(leftValue, rightValue, operator): boolean {
        switch (operator) {
            case '==':
                return leftValue + '' === rightValue + '';
            case '<':
                return leftValue < rightValue;
            case '!=':
                return leftValue + '' !== rightValue + '';
            case '>':
                return leftValue > rightValue;
            case '>=':
                return leftValue >= rightValue;
            case '<=':
                return leftValue <= rightValue;
            case 'empty':
                return leftValue ? leftValue === '' : true;
            case '!empty':
                return leftValue ? leftValue !== '' : false;
            default:
                this.logService.error('NO valid operation!');
                break;
        }
        return;
    }

    cleanProcessVariable() {
        this.processVarList = [];
    }

    getTaskProcessVariable(taskId: string): Observable<TaskProcessVariableModel[]> {
        return from(this.apiService.getInstance().activiti.taskFormsApi.getTaskFormVariables(taskId))
            .pipe(
                map((res) => {
                    const jsonRes = this.toJson(res);
                    this.processVarList = <TaskProcessVariableModel[]> jsonRes;
                    return jsonRes;
                }),
                catchError((err) => this.handleError(err))
            );
    }

    toJson(res: any): any {
        return res || {};
    }

    private isValidOperator(operator: string): boolean {
        return operator !== undefined;
    }

    private isValidCondition(condition: WidgetVisibilityModel): boolean {
        return !!(condition && condition.operator);
    }

    private handleError(err) {
        this.logService.error('Error while performing a call');
        return throwError('Error while performing a call - Server error');
    }
}
