export default class TinyDiInjectable {
   public static $inject: string[] | {
    deps: string[],
    callAs: 'class' | 'function'
  };

  constructor() {}
}
