/**
 * Form field components that integrate React Hook Form with UI components.
 *
 * These wrapper components use React Hook Form's Controller to connect
 * form state management with the design system's Input, Select, and Textarea
 * components.
 */

import { Controller } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Input } from '../ui/Input';
import type { InputProps } from '../ui/Input';
import { Select } from '../ui/Select';
import type { SelectProps } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { TextareaProps } from '../ui/Textarea';

// ============================================
// FORM INPUT
// ============================================

export interface FormInputProps<T extends FieldValues>
  extends Omit<InputProps, 'name' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

/**
 * Form input that integrates React Hook Form with the Input component.
 *
 * @example
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { createUserSchema } from '../../lib/schemas';
 * import { FormInput } from '../../components/form/FormField';
 *
 * const { control, handleSubmit } = useForm({
 *   resolver: zodResolver(createUserSchema),
 * });
 *
 * <FormInput name="email" control={control} label="Email" type="email" />
 * ```
 */
export function FormInput<T extends FieldValues>({
  name,
  control,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Input
          {...props}
          {...field}
          error={error?.message}
        />
      )}
    />
  );
}

// ============================================
// FORM SELECT
// ============================================

export interface FormSelectProps<T extends FieldValues>
  extends Omit<SelectProps, 'name' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

/**
 * Form select that integrates React Hook Form with the Select component.
 *
 * @example
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { createUserSchema } from '../../lib/schemas';
 * import { FormSelect } from '../../components/form/FormField';
 *
 * const { control, handleSubmit } = useForm({
 *   resolver: zodResolver(createUserSchema),
 * });
 *
 * <FormSelect
 *   name="role"
 *   control={control}
 *   label="Role"
 *   options={[
 *     { value: 'viewer', label: 'Viewer' },
 *     { value: 'editor', label: 'Editor' },
 *     { value: 'admin', label: 'Admin' },
 *   ]}
 * />
 * ```
 */
export function FormSelect<T extends FieldValues>({
  name,
  control,
  ...props
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Select
          {...props}
          {...field}
          error={error?.message}
        />
      )}
    />
  );
}

// ============================================
// FORM TEXTAREA
// ============================================

export interface FormTextareaProps<T extends FieldValues>
  extends Omit<TextareaProps, 'name' | 'error'> {
  name: Path<T>;
  control: Control<T>;
}

/**
 * Form textarea that integrates React Hook Form with the Textarea component.
 *
 * @example
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { FormTextarea } from '../../components/form/FormField';
 *
 * const { control, handleSubmit } = useForm();
 *
 * <FormTextarea name="description" control={control} label="Description" />
 * ```
 */
export function FormTextarea<T extends FieldValues>({
  name,
  control,
  ...props
}: FormTextareaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Textarea
          {...props}
          {...field}
          error={error?.message}
        />
      )}
    />
  );
}
