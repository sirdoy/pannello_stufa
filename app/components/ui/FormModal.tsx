'use client';

import { forwardRef, useEffect, useEffectEvent, useState, useRef, type ForwardedRef, type ReactElement, type ReactNode, type RefAttributes } from 'react';
import {
  useForm,
  type Control,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type FormState,
  type Path,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from 'react-hook-form';
import type { ZodTypeAny } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check } from 'lucide-react';
import Modal, { type ModalProps } from './Modal';
import Button from './Button';
import { useDepsChanged } from '@/lib/hooks/useDepsChanged';
import { cn } from '@/lib/utils/cn';

/**
 * Form context passed to the FormModal children render prop
 */
export interface FormModalRenderContext<TValues extends FieldValues = FieldValues> {
  control: Control<TValues>;
  formState: FormState<TValues>;
  register: UseFormRegister<TValues>;
  setValue: UseFormSetValue<TValues>;
  watch: UseFormWatch<TValues>;
  isDisabled: boolean;
  errors: FieldErrors<TValues>;
}

export interface FormModalProps<TValues extends FieldValues = FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TValues) => Promise<void> | void;
  title: string;
  description?: string;
  defaultValues?: DefaultValues<NoInfer<TValues>>;
  validationSchema?: ZodTypeAny;
  size?: ModalProps['size'];
  children?: ReactNode | ((form: FormModalRenderContext<TValues>) => ReactNode);
  submitLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  showSuccessOverlay?: boolean;
  successMessage?: string;
  className?: string;
}

type FormModalComponent = (<TValues extends FieldValues = FieldValues>(
  props: FormModalProps<TValues> & RefAttributes<HTMLDivElement>
) => ReactElement | null) & { displayName?: string };

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
function ErrorSummary({ errors }: { errors: FieldErrors }) {
  // react-hook-form errors are plain FieldError objects (never Error instances)
  const errorList = Object.entries(errors).map(([field, error]) => ({
    field,
    message: typeof error?.message === 'string' && error.message ? error.message : 'Invalid value',
  }));

  if (errorList.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'mb-4 rounded-xl p-4',
        'border border-danger-500/30 bg-danger-500/10',
        'animate-fade-in'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger-500" />
        <div>
          <p className="mb-1 font-semibold text-danger-400">
            Please fix the following errors:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-danger-300">
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
        'size-16 rounded-full',
        'border-2 border-sage-500 bg-sage-500/20',
        'flex items-center justify-center',
        'animate-scale-in'
      )}>
        <Check className="size-8 text-sage-400" />
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
const FormModal = forwardRef(function FormModal<TValues extends FieldValues = FieldValues>(
  {
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    defaultValues = {} as DefaultValues<TValues>,
    validationSchema,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    successMessage,
    size = 'md',
    children,
    className,
    ...props
  }: FormModalProps<TValues>,
  _ref: ForwardedRef<HTMLDivElement>
) {
  // Form state: 'idle' | 'submitting' | 'success' | 'error'
  const [formState, setFormState] = useState('idle');
  // Track if form has been submitted at least once (for error summary display)
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // Ref for triggering shake animation
  const formRef = useRef<HTMLFormElement>(null);
  // Ref to track previous isOpen state for reset logic
  const wasOpenRef = useRef(false);
  // Pending success auto-close timer, cleared on unmount so onClose never fires after it
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolver for React Hook Form validation
  const resolver = validationSchema ? zodResolver(validationSchema) : undefined;

  // Initialize React Hook Form
  const form = useForm<TValues>({
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

  // Reset local state when modal opens (closed → open transition), during render
  const openChanged = useDepsChanged([isOpen]);
  if (openChanged && isOpen) {
    setFormState('idle');
    setHasSubmitted(false);
  }

  // Reads the latest defaultValues without making them an effect dependency (a new
  // object each render would reset the form on every render)
  const resetToDefaults = useEffectEvent(() => reset(defaultValues));

  // Reset the react-hook-form store (external to React state) on the same transition
  useEffect(() => {
    // Only reset when transitioning from closed to open
    if (isOpen && !wasOpenRef.current) {
      resetToDefaults();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  // Handle close with loading prevention
  const handleClose = () => {
    if (isLoading) return; // Prevent close while submitting
    onClose?.();
  };

  // Handle cancel button click with event propagation control
  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling to Modal overlay which could trigger onClose again
    handleClose();
  };

  // Trigger shake animation on invalid fields
  const triggerShakeAnimation = (validationErrors: FieldErrors<TValues>) => {
    if (!formRef.current) return;

    const errorFields = Object.keys(validationErrors || errors);
    errorFields.forEach((fieldName) => {
      const field = formRef.current!.querySelector(`[data-field="${fieldName}"]`);
      if (field && field instanceof HTMLElement) {
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
  };

  // Handle form submission
  const onFormSubmit = async (data: TValues) => {
    setHasSubmitted(true);
    setFormState('submitting');

    try {
      await onSubmit?.(data);
      setFormState('success');

      // Brief success display before close (800ms)
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setFormState('idle');
        onClose?.();
      }, 800);
    } catch (error) {
      setFormState('error');
      console.error('FormModal submission error:', error);
    }
  };

  // Handle validation errors on submit
  const onFormError = (validationErrors: FieldErrors<TValues>) => {
    setHasSubmitted(true);

    // Trigger shake animation on invalid fields
    triggerShakeAnimation(validationErrors);

    // Focus first error field
    const firstErrorField = Object.keys(validationErrors)[0];
    if (firstErrorField) {
      setFocus(firstErrorField as Path<TValues>);
    }
  };

  // Create form context for children render prop
  const formContext: FormModalRenderContext<TValues> = {
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
      isOpen={isOpen}
      onClose={handleClose}
      size={size}
      className={className}
      {...props}
    >
      <div className="relative">
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
          onSubmit={(e) => void handleSubmit(onFormSubmit, onFormError)(e)}
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
              onClick={handleCancelClick}
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
      </div>
    </Modal>
  );
}) as FormModalComponent;

// Named exports
export { FormModal, ErrorSummary, SuccessOverlay };

// Default export
export default FormModal;
