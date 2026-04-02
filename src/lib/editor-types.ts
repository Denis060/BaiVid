/**
 * Typed edit instruction schema for the video editor.
 * Non-destructive — original video is preserved.
 */

export interface TrimInstruction {
  type: "trim";
  startTime: number; // seconds
  endTime: number;
}

export interface TextOverlay {
  type: "text";
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "center" | "bottom";
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
}

export interface CaptionEdit {
  type: "caption";
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface MusicSwap {
  type: "music";
  musicUrl: string;
  musicName: string;
  volume: number; // 0-1
}

export interface Transition {
  type: "transition";
  style: "cut" | "fade" | "slide" | "dissolve";
  atTime: number;
  durationMs: number;
}

export type EditInstruction =
  | TrimInstruction
  | TextOverlay
  | CaptionEdit
  | MusicSwap
  | Transition;

export interface EditPayload {
  videoId: string;
  instructions: EditInstruction[];
}
