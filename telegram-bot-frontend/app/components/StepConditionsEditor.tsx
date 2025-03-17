import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/app/hooks/useTranslation';

export type ConditionOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';

export interface ConditionMatch {
  value: string; 
  operator: ConditionOperator;
  match: string;
}

export interface StepCondition {
  prevStepId: string | number | null;
  answers: ConditionMatch[];
}

interface StepConditionsEditorProps {
  conditions: StepCondition[];
  availablePrevSteps: Array<{ id: number | string; name: string }>;
  onChange: (conditions: StepCondition[]) => void;
}

const StepConditionsEditor: React.FC<StepConditionsEditorProps> = ({
  conditions = [],
  availablePrevSteps = [],
  onChange
}) => {
  const { t } = useTranslation();
  
  // Default previous step name
  const defaultPrevStepName = t('flows.conditions.anyPrevStep');
  
  const handleAddCondition = () => {
    const newConditions = [
      ...conditions, 
      { 
        prevStepId: null, 
        answers: [{ value: '', operator: 'equals' as ConditionOperator, match: '' }] 
      }
    ];
    onChange(newConditions);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    onChange(newConditions);
  };

  const handleChangePrevStep = (index: number, prevStepId: string | number | null) => {
    const newConditions = [...conditions];
    newConditions[index].prevStepId = prevStepId;
    onChange(newConditions);
  };

  const handleAddMatch = (conditionIndex: number) => {
    const newConditions = [...conditions];
    newConditions[conditionIndex].answers.push({ value: '', operator: 'equals' as ConditionOperator, match: '' });
    onChange(newConditions);
  };

  const handleRemoveMatch = (conditionIndex: number, matchIndex: number) => {
    const newConditions = [...conditions];
    newConditions[conditionIndex].answers.splice(matchIndex, 1);
    onChange(newConditions);
  };

  const handleChangeMatch = (
    conditionIndex: number, 
    matchIndex: number, 
    field: keyof ConditionMatch, 
    value: string | ConditionOperator
  ) => {
    const newConditions = [...conditions];
    newConditions[conditionIndex].answers[matchIndex][field] = value as never;
    onChange(newConditions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('flows.conditions.title')}</h3>
        <button
          type="button"
          onClick={handleAddCondition}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          {t('flows.conditions.addCondition')}
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          {t('flows.conditions.noConditions')}
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition, conditionIndex) => (
            <div 
              key={conditionIndex} 
              className="border border-gray-200 rounded-md p-4 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="w-full">
                  <label 
                    htmlFor={`prevStep-${conditionIndex}`} 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {t('flows.conditions.previousStep')}
                  </label>
                  <select
                    id={`prevStep-${conditionIndex}`}
                    value={condition.prevStepId?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChangePrevStep(conditionIndex, value === '' ? null : value);
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="">{t('flows.conditions.anyPrevStep')}</option>
                    {availablePrevSteps.map((step) => (
                      <option key={step.id} value={step.id.toString()}>
                        {step.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(conditionIndex)}
                  className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:hover:bg-red-900"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flows.conditions.responseConditions')}
                </label>
                <div className="space-y-2">
                  {condition.answers.map((match, matchIndex) => (
                    <div key={matchIndex} className="flex items-center space-x-2">
                      <select
                        value={match.operator}
                        onChange={(e) => handleChangeMatch(conditionIndex, matchIndex, 'operator', e.target.value as ConditionOperator)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="equals">{t('flows.conditions.operators.equals')}</option>
                        <option value="contains">{t('flows.conditions.operators.contains')}</option>
                        <option value="startsWith">{t('flows.conditions.operators.startsWith')}</option>
                        <option value="endsWith">{t('flows.conditions.operators.endsWith')}</option>
                        <option value="regex">{t('flows.conditions.operators.regex')}</option>
                      </select>
                      <input
                        type="text"
                        value={match.match}
                        onChange={(e) => handleChangeMatch(conditionIndex, matchIndex, 'match', e.target.value)}
                        placeholder={t('flows.conditions.valueToCheck')}
                        className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMatch(conditionIndex, matchIndex)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:hover:bg-red-900"
                        disabled={condition.answers.length === 1}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddMatch(conditionIndex)}
                  className="mt-2 inline-flex items-center px-2 py-1 border border-gray-300 text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-indigo-300 focus:shadow-outline-indigo active:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {t('flows.conditions.addOption')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StepConditionsEditor; 