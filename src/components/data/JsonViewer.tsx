interface JsonViewerProps {
  data: unknown;
}

export function JsonViewer({ data }: JsonViewerProps) {
  return (
    <pre className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-xs font-mono overflow-x-auto text-gray-700 dark:text-gray-300">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
