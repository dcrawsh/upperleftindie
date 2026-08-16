import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Form primitives — Figma component sets 14:32 (Text Field) and 14:63
 * (Consent Checkbox).
 *
 * Every field programmatically associates its helper and error text
 * (`aria-describedby` + `aria-invalid`), the error state pairs a 2px stroke
 * with an explanatory message rather than relying on colour, and focus is the
 * global 3px ring rather than a border-colour change.
 */

const controlBase =
  "w-full rounded-field bg-page px-4 py-3.5 type-body-m text-primary transition placeholder:text-tertiary";

function controlClasses(hasError: boolean, extra = "") {
  return [
    controlBase,
    hasError ? "border-2 border-error" : "border-[1.5px] border-strong",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function FieldLabel({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block type-body-s font-semibold text-primary">
      {children}
      {optional ? (
        <span className="ml-1.5 font-normal text-tertiary">(optional)</span>
      ) : null}
    </label>
  );
}

export function HelperText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="type-body-s text-tertiary">
      {children}
    </p>
  );
}

export function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="type-body-s font-medium text-error">
      {children}
    </p>
  );
}

type FieldShellProps = {
  id: string;
  label: ReactNode;
  optional?: boolean;
  helper?: ReactNode;
  error?: string;
  children: (describedBy: string | undefined, hasError: boolean) => ReactNode;
};

function FieldShell({
  id,
  label,
  optional,
  helper,
  error,
  children,
}: FieldShellProps) {
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      {children(describedBy, Boolean(error))}
      {error && errorId ? <ErrorText id={errorId}>{error}</ErrorText> : null}
      {helper && helperId ? <HelperText id={helperId}>{helper}</HelperText> : null}
    </div>
  );
}

type TextFieldProps = {
  id: string;
  label: ReactNode;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function TextField({
  id,
  label,
  helper,
  error,
  optional,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} helper={helper} error={error} optional={optional}>
      {(describedBy, hasError) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className={controlClasses(hasError)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

type SelectFieldProps = {
  id: string;
  label: ReactNode;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "children">;

export function SelectField({
  id,
  label,
  helper,
  error,
  optional,
  children,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} helper={helper} error={error} optional={optional}>
      {(describedBy, hasError) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className={controlClasses(hasError, "appearance-none bg-[right_1rem_center] bg-no-repeat pr-10")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' stroke='%23101014' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          }}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

type TextareaFieldProps = {
  id: string;
  label: ReactNode;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">;

export function TextareaField({
  id,
  label,
  helper,
  error,
  optional,
  ...rest
}: TextareaFieldProps) {
  return (
    <FieldShell id={id} label={label} helper={helper} error={error} optional={optional}>
      {(describedBy, hasError) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className={controlClasses(hasError, "min-h-28 resize-y")}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

/**
 * Consent Checkbox — Figma 14:63. Consent copy renders at text/tertiary
 * (5.88:1); the previous build rendered this exact text at 4.15:1, the
 * lowest-contrast text in the product. Newsletter consent ships unchecked.
 */
export function ConsentCheckbox({
  id,
  title,
  description,
  checked,
  onChange,
  name,
}: {
  id: string;
  title: ReactNode;
  description: ReactNode;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
}) {
  const descriptionId = `${id}-description`;

  return (
    <div className="flex items-start gap-3 rounded-field border-[1.5px] border-subtle bg-surface p-4">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-describedby={descriptionId}
        className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-[4px] border-2 border-strong accent-accent-solid"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={id} className="type-body-m-medium text-primary">
          {title}
        </label>
        <p id={descriptionId} className="type-body-s text-tertiary">
          {description}
        </p>
      </div>
    </div>
  );
}
