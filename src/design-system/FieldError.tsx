// src/components/ui/FieldError.tsx
export default function FieldError({ message }: { message?: string }) {
  if (!message) return null; // no element -> no extra space

  // .error-base carries the shared error-text tokens (see styles/components/form.css)
  return <p className="error-base leading-tight">{message}</p>;
}
