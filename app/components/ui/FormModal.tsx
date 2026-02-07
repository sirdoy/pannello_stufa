'use client';

import { forwardRef, useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '@/lib/utils/cn';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void;
  title: string;
  description?: string;
  fields: any[];
  initialValues?: any;
  schema?: any;
  submitLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  showSuccessOverlay?: boolean;
  successMessage?: string;
  className?: string;
  [key: string]: any;
}

/**
 * FormModal Component - Ember Noir Design System
 *
 * Modal with integrated React Hook Form for validated form dialogs.
 * Features:
 * - Hybrid validation: onBlur for touched fields, summary on submit
 * - Error display: inline below fields + summary at top
 * - Shake animation on invalid fields during submit
 * - Loading state with disabled fields and prevented close
 * - Success checkmark overlay before auto-close
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Callback when modal should close
 * @param {Function} props.onSubmit - Async callback with validated form data
 * @param {string} props.title - Modal title (required)
 * @param {string} [props.description] - Optional description below title
 * @param {Object} [props.defaultValues] - Initial form values
 * @param {import('zod').ZodSchema} [props.validationSchema] - Zod schema for validation
 * @param {string} [props.submitLabel='Save'] - Submit button label
 * @param {string} [props.cancelLabel='Cancel'] - Cancel button label
 * @param {string} [props.successMessage] - Message shown on success before close
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.size='md'] - Modal size variant
 * @param {Function} props.children - Render prop: (form) => ReactNode
 *
 * @example
 * <FormModal
 *   isOpen={showEdit}
 *   onClose={() => setShowEdit(false)}
 *   onSubmit={handleSave}
 *   title="Edit Schedule"
 *   defaultValues={{ name: 'Morning', time: '07:00' }}
 *   validationSchema={scheduleSchema}
 *   successMessage="Schedule saved!"
 * >
 *   {({ control, formState }) => (
 *     <Controller
 *       name="name"
 *       control={control}
 *       render={({ field, fieldState }) => (
 *         <Input
 *           label="Name"
 *           {...field}
 *           error={fieldState.error?.message}
 *           data-field="name"
 *         />
 *       )}
 *     />
 *   )}
 * </FormModal>
 */

/**
 * Internal ErrorSummary component - displays all errors at top of form
 */
function ErrorSummary({ errors }) {
  const errorList = Object.entries(errors).map(([field, error]) => ({
    field,
    message: (error as any)?.message || 'Invalid value',
  }));

  if (errorList.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'mb-4 p-4 rounded-xl',
        'bg-danger-500/10 border border-danger-500/30',
        'animate-fade-in'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-danger-400 mb-1">
            Please fix the following errors:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-danger-300">
            {errorList.map(({ field, message }) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Internal SuccessOverlay component - brief checkmark before close
 */
function SuccessOverlay({ message }: { message?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10',
        'flex flex-col items-center justify-center',
        'bg-slate-900/95 backdrop-blur-sm',
        'rounded-3xl',
        'animate-fade-in'
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn(
        'w-16 h-16 rounded-full',
        'bg-sage-500/20 border-2 border-sage-500',
        'flex items-center justify-center',
        'animate-scale-in'
      )}>
        <Check className="h-8 w-8 text-sage-400" />
      </div>
      {message && (
        <p className="mt-4 text-lg font-semibold text-slate-200">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * FormModal main component
 */
const FormModal = forwardRef<HTMLDivElement, FormModalProps>(function FormModal(
  {
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    defaultValues = {},
    validationSchema,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    successMessage,
    size = 'md',
    children,
    className,
    ...props
  },
  ref
) {
  // Form state: 'idle' | 'submitting' | 'success' | 'error'
  const [formState, setFormState] = useState('idle');
  // Track if form has been submitted at least once (for error summary display)
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // Ref for triggering shake animation
  const formRef = useRef(null);
  // Ref to track previous isOpen state for reset logic
  const wasOpenRef = useRef(false);

  // Memoize resolver to prevent re-initialization on every render
  const resolver = useMemo(
    () => (validationSchema ? zodResolver(validationSchema) : undefined),
    [validationSchema]
  );

  // Initialize React Hook Form
  const form = useForm({
    defaultValues,
    resolver,
    mode: 'onBlur', // Validate on blur for touched fields
    reValidateMode: 'onChange', // After first error, validate on change
  });

  const {
    control,
    handleSubmit,
    formState: rhfFormState,
    reset,
    setFocus,
    register,
    setValue,
    watch,
  } = form;

  const { errors, isSubmitting } = rhfFormState;
  const isLoading = formState === 'submitting' || isSubmitting;

  // Reset form when modal opens (not when it's already open)
  useEffect(() => {
    // Only reset when transitioning from closed to open
    if (isOpen && !wasOpenRef.current) {
      reset(defaultValues);
      setFormState('idle');
      setHasSubmitted(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, reset]); // Note: defaultValues intentionally excluded to prevent infinite loop

  // Handle close with loading prevention
  const handleClose = useCallback(() => {
    if (isLoading) return; // Prevent close while submitting
    onClose?.();
  }, [isLoading, onClose]);

  // Trigger shake animation on invalid fields
  const triggerShakeAnimation = useCallback((validationErrors) => {
    if (!formRef.current) return;

    const errorFields = Object.keys(validationErrors || errors);
    errorFields.forEach((fieldName) => {
      const field = formRef.current.querySelector(`[data-field="${fieldName}"]`);
      if (field) {
        // Remove class first to allow re-trigger
        field.classList.remove('animate-shake');
        // Force reflow
        void field.offsetWidth;
        // Add shake class
        field.classList.add('animate-shake');
        // Remove after animation completes
        const handleAnimationEnd = () => {
          field.classList.remove('animate-shake');
          field.removeEventListener('animationend', handleAnimationEnd);
        };
        field.addEventListener('animationend', handleAnimationEnd);
      }
    });
  }, [errors]);

  // Handle form submission
  const onFormSubmit = async (data) => {
    setHasSubmitted(true);
    setFormState('submitting');

    try {
      await onSubmit?.(data);
      setFormState('success');

      // Brief success display before close (800ms)
      setTimeout(() => {
        setFormState('idle');
        onClose?.();
      }, 800);
    } catch (error) {
      setFormState('error');
      console.error('FormModal submission error:', error);
    }
  };

  // Handle validation errors on submit
  const onFormError = (validationErrors) => {
    setHasSubmitted(true);

    // Trigger shake animation on invalid fields
    triggerShakeAnimation(validationErrors);

    // Focus first error field
    const firstErrorField = Object.keys(validationErrors)[0];
    if (firstErrorField) {
      setFocus(firstErrorField);
    }
  };

  // Create form context for children render prop
  const formContext = {
    control,
    formState: rhfFormState,
    register,
    setValue,
    watch,
    isDisabled: isLoading,
    errors,
  };

  return (
    <Modal
      {...({ ref, isOpen, onClose: handleClose, size, className: cn('relative', className), ...props } as any)}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        <Modal.Close disabled={isLoading} />
      </Modal.Header>

      {description && (
        <Modal.Description className="mb-4">
          {description}
        </Modal.Description>
      )}

      {/* Error summary at top - only show after first submit attempt */}
      {hasSubmitted && Object.keys(errors).length > 0 && (
        <ErrorSummary errors={errors} />
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit(onFormSubmit, onFormError)}
        noValidate
      >
        {/* Form fields via render prop */}
        <fieldset disabled={isLoading} className="space-y-4">
          {typeof children === 'function' ? children(formContext) : children}
        </fieldset>

        <Modal.Footer>
          <Button
            type="button"
            variant="subtle"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="ember"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </Modal.Footer>
      </form>

      {/* Success overlay */}
      {formState === 'success' && (
        <SuccessOverlay message={successMessage} />
      )}
    </Modal>
  );
});

// Named exports
export { FormModal, ErrorSummary, SuccessOverlay };

// Default export
export default FormModal;
