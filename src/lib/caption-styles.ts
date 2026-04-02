/**
 * Caption Styles System
 * 12 animated caption styles with Shotstack/FFmpeg compatibility
 */

export interface CaptionStyle {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontSize: number; // px
  primaryColor: string; // hex
  secondaryColor: string; // hex
  backgroundColor?: string; // hex with alpha
  position: "top" | "center" | "bottom";
  animation:
    | "highlight"
    | "karaoke"
    | "typewriter"
    | "popup"
    | "fade"
    | "bounce"
    | "neon"
    | "fire"
    | "split"
    | "shake"
    | "slidein"
    | "wordbox";
  shotstack?: {
    effect?: string;
    css?: string; // inline CSS for Shotstack HTML asset
  };
}

export const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: "highlight",
    name: "Highlight",
    description: "Current word highlighted in yellow, rest white. Classic news/podcast style.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#FFEB3B",
    secondaryColor: "#FFFFFF",
    position: "bottom",
    animation: "highlight",
    shotstack: {
      effect: "highlight",
      css: `
        .caption-text { color: white; font-size: 24px; }
        .caption-word.active { color: #FFEB3B; font-weight: bold; }
      `,
    },
  },
  {
    id: "karaoke",
    name: "Karaoke",
    description: "Words light up one by one in primary green (#0a7c4e) as spoken.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#0a7c4e",
    secondaryColor: "#FFFFFF",
    position: "center",
    animation: "karaoke",
    shotstack: {
      effect: "karaoke",
      css: `
        .caption-text { color: white; font-size: 24px; }
        .caption-word.active { color: #0a7c4e; font-weight: bold; }
      `,
    },
  },
  {
    id: "typewriter",
    name: "Typewriter",
    description: "Letters appear one at a time with a blinking cursor.",
    fontFamily: "'Courier New', monospace",
    fontSize: 20,
    primaryColor: "#FFFFFF",
    secondaryColor: "#00FF00",
    position: "bottom",
    animation: "typewriter",
    shotstack: {
      effect: "typewriter",
      css: `
        .caption-text { color: white; font-family: 'Courier New', monospace; font-size: 20px; }
        .caption-cursor { border-right: 2px solid #00FF00; animation: blink 1s infinite; }
      `,
    },
  },
  {
    id: "popup",
    name: "Pop-up",
    description: "Each word pops up with a scale-in animation from 0 to 100%.",
    fontFamily: "Inter, sans-serif",
    fontSize: 28,
    primaryColor: "#0a7c4e",
    secondaryColor: "#FFFFFF",
    position: "center",
    animation: "popup",
    shotstack: {
      effect: "scale",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 28px;
          animation: popupScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `,
    },
  },
  {
    id: "fade",
    name: "Fade",
    description: "Words fade in smoothly, 0 to 100% opacity.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#0a7c4e",
    secondaryColor: "#FFFFFF",
    position: "center",
    animation: "fade",
    shotstack: {
      effect: "fade",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 24px;
          animation: fadeIn 0.5s ease-in;
        }
      `,
    },
  },
  {
    id: "bounce",
    name: "Bounce",
    description: "Words drop in from above with a bounce effect.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#0a7c4e",
    secondaryColor: "#FFFFFF",
    position: "center",
    animation: "bounce",
    shotstack: {
      effect: "bounce",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 24px;
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `,
    },
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "White text with an animated neon green glow/pulse (#0a7c4e).",
    fontFamily: "Inter, sans-serif",
    fontSize: 28,
    primaryColor: "#FFFFFF",
    secondaryColor: "#0a7c4e",
    position: "center",
    animation: "neon",
    shotstack: {
      effect: "glow",
      css: `
        .caption-text {
          color: white;
          font-size: 28px;
          font-weight: bold;
          text-shadow: 0 0 10px #0a7c4e, 0 0 20px #0a7c4e;
          animation: neonPulse 1.5s ease-in-out infinite;
        }
      `,
    },
  },
  {
    id: "fire",
    name: "Fire",
    description: "Bold text with orange-red gradient color effect.",
    fontFamily: "Inter, sans-serif",
    fontSize: 28,
    primaryColor: "#FF6B35",
    secondaryColor: "#FF3D00",
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    position: "center",
    animation: "fire",
    shotstack: {
      effect: "gradient",
      css: `
        .caption-text {
          font-size: 28px;
          font-weight: bold;
          background: linear-gradient(90deg, #FF6B35, #FF3D00, #FF6B35);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fireGradient 2s ease-in-out infinite;
        }
      `,
    },
  },
  {
    id: "split",
    name: "Split Color",
    description: "First half of word in white, second half in primary green.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#0a7c4e",
    secondaryColor: "#FFFFFF",
    position: "center",
    animation: "split",
    shotstack: {
      effect: "split",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 24px;
          position: relative;
        }
        .caption-word::after {
          content: attr(data-split);
          position: absolute;
          left: 50%;
          color: #0a7c4e;
          width: 50%;
          overflow: hidden;
        }
      `,
    },
  },
  {
    id: "shake",
    name: "Shake",
    description: "Text appears with a quick shake/vibration on entry.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#FFFFFF",
    secondaryColor: "#0a7c4e",
    position: "center",
    animation: "shake",
    shotstack: {
      effect: "shake",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 24px;
          animation: shake 0.4s ease-in-out;
        }
      `,
    },
  },
  {
    id: "slidein",
    name: "Slide In",
    description: "Words slide in from the left one by one.",
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    primaryColor: "#FFFFFF",
    secondaryColor: "#0a7c4e",
    position: "center",
    animation: "slidein",
    shotstack: {
      effect: "slide",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 24px;
          animation: slideInLeft 0.5s ease-out;
        }
      `,
    },
  },
  {
    id: "wordbox",
    name: "Word Box",
    description: "Each word in a rounded box with primary bg, white text.",
    fontFamily: "Inter, sans-serif",
    fontSize: 20,
    primaryColor: "#0a7c4e",
    secondaryColor: "#FFFFFF",
    position: "center",
    animation: "wordbox",
    shotstack: {
      effect: "background",
      css: `
        .caption-word {
          display: inline-block;
          color: white;
          font-size: 20px;
          background-color: #0a7c4e;
          padding: 6px 12px;
          border-radius: 20px;
          margin: 4px;
          animation: popupScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `,
    },
  },
];

export function getCaptionStyle(id: string): CaptionStyle | undefined {
  return CAPTION_STYLES.find((style) => style.id === id);
}

export function getCaptionStyleByIndex(index: number): CaptionStyle | undefined {
  return CAPTION_STYLES[index];
}

export function getAllCaptionStyles(): CaptionStyle[] {
  return [...CAPTION_STYLES];
}
