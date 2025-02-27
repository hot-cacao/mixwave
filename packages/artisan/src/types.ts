import type { LangCode, VideoCodec, AudioCodec } from "@mixwave/shared";

export type Stream =
  | {
      type: "video";
      codec: VideoCodec;
      height: number;
      bitrate: number;
      framerate: number;
    }
  | {
      type: "audio";
      codec: AudioCodec;
      bitrate: number;
      language: LangCode;
    }
  | {
      type: "text";
      language: LangCode;
    };

export type Input =
  | {
      type: "video";
      path: string;
    }
  | {
      type: "audio";
      path: string;
      language: LangCode;
    }
  | {
      type: "text";
      path: string;
      language: LangCode;
    };
