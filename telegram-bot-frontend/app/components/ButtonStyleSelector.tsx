import React from 'react';
import { RadioGroup } from '@headlessui/react';
import { ChatBubbleLeftRightIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { useTranslation } from '@/app/hooks/useTranslation';

export type ButtonStyle = 'inline' | 'keyboard';

interface ButtonStyleSelectorProps {
  value: ButtonStyle;
  onChange: (style: ButtonStyle) => void;
}

export default function ButtonStyleSelector({ value, onChange }: ButtonStyleSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <RadioGroup value={value} onChange={onChange} className="mt-1">
        <div className="grid grid-cols-2 gap-2">
          <RadioGroup.Option
            value="inline"
            className={({ active, checked }) =>
              `${
                active
                  ? 'ring-2 ring-offset-2 ring-offset-indigo-300 ring-white ring-opacity-60'
                  : ''
              }
              ${
                checked ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700'
              }
                relative rounded-lg shadow-md px-3 py-2 cursor-pointer flex focus:outline-none`
            }
          >
            {({ checked }) => (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={`font-medium ${
                          checked ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {t('flows.buttonStyle.inline')}
                      </RadioGroup.Label>
                      <RadioGroup.Description
                        as="span"
                        className={`inline text-xs ${
                          checked ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {t('flows.buttonStyle.inlineDescription')}
                      </RadioGroup.Description>
                    </div>
                  </div>
                </div>
              </>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option
            value="keyboard"
            className={({ active, checked }) =>
              `${
                active
                  ? 'ring-2 ring-offset-2 ring-offset-indigo-300 ring-white ring-opacity-60'
                  : ''
              }
              ${
                checked ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700'
              }
                relative rounded-lg shadow-md px-3 py-2 cursor-pointer flex focus:outline-none`
            }
          >
            {({ checked }) => (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={`font-medium ${
                          checked ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {t('flows.buttonStyle.keyboard')}
                      </RadioGroup.Label>
                      <RadioGroup.Description
                        as="span"
                        className={`inline text-xs ${
                          checked ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {t('flows.buttonStyle.keyboardDescription')}
                      </RadioGroup.Description>
                    </div>
                  </div>
                </div>
              </>
            )}
          </RadioGroup.Option>
        </div>
      </RadioGroup>
    </div>
  );
} 