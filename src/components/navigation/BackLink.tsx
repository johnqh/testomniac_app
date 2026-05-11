import { ChevronLeftIcon } from '@heroicons/react/20/solid';

interface BackLinkProps {
  label: string;
  onClick: () => void;
}

export default function BackLink({ label, onClick }: BackLinkProps) {
  return (
    <button
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
