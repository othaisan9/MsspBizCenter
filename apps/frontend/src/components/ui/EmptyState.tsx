import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 text-gray-400">{icon}</div>
      )}
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
      {action && (
        <Button variant="secondary" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
