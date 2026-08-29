import type { CanvasElement, ElementStyle, ElementType, RootStyle, StyleKey } from "./types";

type AiElementExtras = {
    name?: string;
    alt?: string;
    /** Filled by the server after the image is generated and stored. */
    imagePrompt?: string;
    styleBindings?: Partial<Record<StyleKey, string>>;
    interaction?: CanvasElement["interaction"];
    pressStyle?: Partial<ElementStyle>;
    loop?: CanvasElement["loop"];
    draggable?: boolean;
};

export type AiDesignOperation =
    | {
          kind: "add";
          ref: string;
          type: ElementType;
          parentId?: string | null;
          content?: string;
          src?: string;
          href?: string;
          style?: Partial<ElementStyle>;
          tabletStyle?: Partial<ElementStyle>;
          mobileStyle?: Partial<ElementStyle>;
          hoverStyle?: Partial<ElementStyle>;
      } & AiElementExtras
    | {
          kind: "update";
          id: string;
          content?: string;
          src?: string;
          href?: string;
          style?: Partial<ElementStyle>;
          tabletStyle?: Partial<ElementStyle>;
          mobileStyle?: Partial<ElementStyle>;
          hoverStyle?: Partial<ElementStyle>;
      } & AiElementExtras
    | { kind: "remove"; id: string }
    | { kind: "page"; style: Partial<RootStyle> };

export type AiDesignPlan = {
    message: string;
    steps: string[];
    operations: AiDesignOperation[];
    /** Keeps generated refs alive while one section arrives operation by operation. */
    streamKey?: string;
    /** Clears an older run that happened to use the same stream key. */
    streamReset?: boolean;
};
