import { Check, X } from 'lucide-react';

const rules = [
  { test: (pw) => pw.length >= 6, label: 'At least 6 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'One number' },
];

export default function PasswordRequirements({ password }) {
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {rules.map((rule) => {
        const pass = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-1.5 text-xs">
            {pass ? (
              <Check size={12} className="text-green-500 shrink-0" />
            ) : (
              <X size={12} className="text-red-500 shrink-0" />
            )}
            <span className={pass ? 'text-green-600' : 'text-muted'}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
