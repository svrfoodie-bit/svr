/**
 * Shared loading spinner component.
 * Usage: <LoadingSpinner /> or <LoadingSpinner size="sm" text="Loading data..." />
 */
const LoadingSpinner = ({ size = 'md', text = '', fullPage = false }) => {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-2',
    lg: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-primary-600 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
