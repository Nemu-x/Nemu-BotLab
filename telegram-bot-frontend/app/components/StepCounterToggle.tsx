import React from 'react';
import { Switch } from '@headlessui/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useTranslation } from '@/app/hooks/useTranslation';

interface StepCounterToggleProps {
  hideStepCounter: boolean;
  onChange: (hideStepCounter: boolean) => void;
}

const StepCounterToggle: React.FC<StepCounterToggleProps> = ({ 
  hideStepCounter, 
  onChange 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('flows.steps.stepCounter')}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {hideStepCounter 
            ? t('flows.steps.stepCounterHidden') 
            : t('flows.steps.stepCounterVisible')}
        </span>
      </div>
      
      <Switch
        checked={hideStepCounter}
        onChange={onChange}
        className={classNames(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          hideStepCounter ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <span className="sr-only">
          {hideStepCounter ? t('flows.steps.showStepCounter') : t('flows.steps.hideStepCounter')}
        </span>
        <span
          className={classNames(
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            hideStepCounter ? 'translate-x-5' : 'translate-x-0'
          )}
        >
          <span
            className={classNames(
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
              hideStepCounter ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
            )}
            aria-hidden="true"
          >
            <EyeIcon className="h-3 w-3 text-gray-400" />
          </span>
          <span
            className={classNames(
              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
              hideStepCounter ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
            )}
            aria-hidden="true"
          >
            <EyeSlashIcon className="h-3 w-3 text-indigo-600" />
          </span>
        </span>
      </Switch>
    </div>
  );
};

export default StepCounterToggle; 