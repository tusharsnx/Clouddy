import { envs } from "./envs.ts";

export const isDev = envs.NODE_ENV === "development";
export const MaxIDLength = 1024;
export const TokenName = isDev ? "SID" : "_Secure-SID";

export const UploadRequestMaxAgeSecs = 60; // 1 Min
export const MaxUsageLimitBytes = 10 * 1024 * 1024; // 10 MB

export const ContentTypes = [
  // Text Files
  { extension: ".txt", mimeType: "text/plain" },
  { extension: ".html", mimeType: "text/html" },
  { extension: ".css", mimeType: "text/css" },
  { extension: ".js", mimeType: "application/javascript" },
  { extension: ".json", mimeType: "application/json" },
  { extension: ".xml", mimeType: "application/xml" },

  // Image Files
  { extension: ".jpg", mimeType: "image/jpeg" },
  { extension: ".jpeg", mimeType: "image/jpeg" },
  { extension: ".png", mimeType: "image/png" },
  { extension: ".gif", mimeType: "image/gif" },
  { extension: ".svg", mimeType: "image/svg+xml" },
  { extension: ".webp", mimeType: "image/webp" },

  // Audio Files
  { extension: ".mp3", mimeType: "audio/mpeg" },
  { extension: ".wav", mimeType: "audio/wav" },
  { extension: ".ogg", mimeType: "audio/ogg" },

  // Video Files
  { extension: ".mp4", mimeType: "video/mp4" },
  { extension: ".webm", mimeType: "video/webm" },
  { extension: ".mov", mimeType: "video/quicktime" },

  // Application Files
  { extension: ".pdf", mimeType: "application/pdf" },
  { extension: ".zip", mimeType: "application/zip" },
  { extension: ".gz", mimeType: "application/gzip" },
  { extension: ".tar", mimeType: "application/x-tar" },
  { extension: ".doc", mimeType: "application/msword" },
  {
    extension: ".docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  { extension: ".xls", mimeType: "application/vnd.ms-excel" },
  {
    extension: ".xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  { extension: ".ppt", mimeType: "application/vnd.ms-powerpoint" },
  {
    extension: ".pptx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },

  // Font Files
  { extension: ".woff", mimeType: "font/woff" },
  { extension: ".woff2", mimeType: "font/woff2" },
  { extension: ".ttf", mimeType: "font/ttf" },
  { extension: ".otf", mimeType: "font/otf" },

  // Binary Files
  { extension: ".bin", mimeType: "application/octet-stream" },
] as const;
export const MimeTypes = new Set<string>(ContentTypes.map((t) => t.mimeType));
