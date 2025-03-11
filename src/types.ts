export type PlistItem = {
  frame: `{{${number},${number}},{${number},${number}}}`;
  offset: `{${number},${number}}`;
  rotated: boolean;
  sourceColorRect: `{{${number},${number}},{${number},${number}}}`;
  sourceSize: `{${number},${number}}`;
};

export type Plist = {
  frames: Record<string, PlistItem>;
};
