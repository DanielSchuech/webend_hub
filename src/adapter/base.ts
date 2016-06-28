export interface Adapter {
  initialise?: () => string;
  load: (plugin: string , entryFile: string) => string;
  finalise?: () => string;
  autoIndexHTMLBodyContent?: () => string;
}
