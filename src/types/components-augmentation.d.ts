// Module augmentation: React 19's React.FC no longer includes implicit children.
// The upstream @sudobility/components Select is typed as React.FC<SelectProps>
// and may not inherit children depending on @radix-ui/react-select resolution.
import '@sudobility/components';

declare module '@sudobility/components' {
  interface SelectProps {
    children?: import('react').ReactNode;
  }
}
