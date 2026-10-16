import type { ComponentType } from "react";

type ThreeDViewerProps = {
  projectId?: string | number;
  viewerCommand?: {
    type: string;
    id?: number;
    [key: string]: unknown;
  } | null;
  onAnnotationsChange?: (items: any[]) => void;
  onModelUploaded?: (...args: any[]) => void;
};

declare const ThreeDViewer: ComponentType<ThreeDViewerProps>;

export default ThreeDViewer;