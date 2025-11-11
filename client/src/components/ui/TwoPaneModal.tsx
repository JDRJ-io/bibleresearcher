import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLandscapeSidecar } from '@/hooks/useLandscapeSidecar';

interface TwoPaneModalProps {
  isOpen: boolean;
  onClose: () => void;
  leftPane: React.ReactNode | ((isLandscape: boolean) => React.ReactNode);
  rightPane: React.ReactNode | ((isLandscape: boolean) => React.ReactNode);
  header?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  paneWrapperClassName?: string;
  leftPaneClassName?: string;
  rightPaneClassName?: string;
  renderShell?: (content: React.ReactNode) => React.ReactNode;
  testId?: string;
}

export function TwoPaneModal({
  isOpen,
  onClose,
  leftPane,
  rightPane,
  header,
  className,
  overlayClassName,
  paneWrapperClassName,
  leftPaneClassName,
  rightPaneClassName,
  renderShell,
  testId = 'modal-two-pane',
}: TwoPaneModalProps) {
  const isLandscape = useLandscapeSidecar();

  if (!isOpen) return null;

  const leftContent = typeof leftPane === 'function' ? leftPane(isLandscape) : leftPane;
  const rightContent = typeof rightPane === 'function' ? rightPane(isLandscape) : rightPane;

  const modalContent = (
    <div
      className={cn(
        "relative bg-background rounded-lg shadow-2xl",
        "w-[90vw] max-h-[90vh] flex flex-col",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Fixed Header with Close Button */}
      <div className="relative flex-shrink-0">
        {header && (
          <div className="p-4 border-b border-border">
            {header}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent transition-colors z-10"
          data-testid={`${testId}-close`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Two-Pane Layout (landscape) or Stacked (portrait) - Single-Scroll Parent */}
      <div
        className={cn(
          "flex-1 overflow-y-auto",
          isLandscape ? "grid grid-cols-12" : "flex flex-col",
          paneWrapperClassName
        )}
      >
        {/* Left Pane */}
        <div
          className={cn(
            isLandscape ? "col-span-5 border-r border-border" : "",
            leftPaneClassName
          )}
          data-testid={`${testId}-left-pane`}
        >
          {leftContent}
        </div>

        {/* Right Pane */}
        <div
          className={cn(
            isLandscape ? "col-span-7" : "",
            rightPaneClassName
          )}
          data-testid={`${testId}-right-pane`}
        >
          {rightContent}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm",
        overlayClassName
      )}
      onClick={onClose}
      data-testid={testId}
    >
      {renderShell ? renderShell(modalContent) : modalContent}
    </div>
  );
}

// Simplified single-pane modal for components that don't need two panes
interface SinglePaneModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  testId?: string;
}

export function SinglePaneModal({
  isOpen,
  onClose,
  children,
  header,
  className,
  contentClassName,
  testId = 'modal-single-pane',
}: SinglePaneModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      data-testid={testId}
    >
      <div
        className={cn(
          "relative bg-background rounded-lg shadow-2xl",
          "w-[90vw] max-h-[90vh] flex flex-col",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Close Button */}
        <div className="relative flex-shrink-0">
          {header && (
            <div className="p-4 border-b border-border">
              {header}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent transition-colors z-10"
            data-testid={`${testId}-close`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className={cn("flex-1 overflow-y-auto", contentClassName)}
          style={{ paddingBottom: 'var(--kb)' }}
          data-testid={`${testId}-content`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
