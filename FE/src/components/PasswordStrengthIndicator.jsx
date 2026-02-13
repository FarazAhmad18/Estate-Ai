export default function PasswordStrengthIndicator({ password }) {
  const getScore = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (password.length >= 10 || /[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  if (!password) return null;

  const score = getScore();
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ff3b30', '#ff3b30', '#ff9500', '#34c759', '#34c759'];

  return (
    <div className="mt-2">
      <div className="flex gap-1.5 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ backgroundColor: i < score ? colors[score] : '#e5e5e5' }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  );
}
