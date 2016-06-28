import {Adapter} from './base';

export default class Angular2Adapter implements Adapter {
  private loadedPlugins: string[] = [];
  private enabledAngularJS = false;
  constructor(private deps: any, private frameworks: string[], private config: any) {
    this.enabledAngularJS = this.frameworks.indexOf('angular') > -1;
  }

  initialise() {
    let init = `
      import 'zone.js/dist/zone';
      import 'reflect-metadata';
    `;
    init += `import {Component, Directive, Injectable} from '@angular/core';\n`;
    init += `import {dashToCamel} from 'ngadapter/build/helper';`;
    init += `declare var Reflect: any;\n`;
    init += `let components: any[] = [];\n`;
    init += `let directives: any[] = [];\n`;
    init += `let services: any[] = [];\n`;
    init += `let meta: any;\n`;
    init += `declare var webend: any;\n`;
    init += `webend.components = components;\n`;
    init += `webend.directives = directives;\n`;
    init += `webend.services = services;\n`;
    init += this.getComponentFn();
    init += this.getDirectiveFn();
    init += this.getServiceFn();

    return init;
  }

  load(plugin: string, entryFile: string) {
    this.loadedPlugins.push(plugin);
    let code = `
      import * as ${plugin} from '${plugin}/${entryFile}';
      if (${plugin}) {
        Object.keys(${plugin}).forEach((exp) => {
          meta = Reflect.getOwnMetadata('annotations', (<any>${plugin})[exp]);
          if (meta && meta[0] && meta[0]) {
            if (meta[0].constructor.name === 'ComponentMetadata' ||
                meta[0].constructor.name === 'DirectiveMetadata') {
              //bind to angular module
              if (meta[0].selector) {
                if (meta[0].template) {
                  components.push((<any>${plugin})[exp]);
    `;
    if (this.enabledAngularJS) {
      code += `
                  module.directive(dashToCamel(meta[0].selector), 
                    <any>webend.adapter.downgradeNg2Component((<any>${plugin})[exp]));
      `;
    }
    code += `
                } else {
                  directives.push((<any>${plugin})[exp]);
                  let selector = meta[0].selector;
    `;
    if (this.enabledAngularJS) {
      code += `
                  module.directive(dashToCamel(selector.substring(1, selector.length - 1)), 
                    <any>webend.adapter.downgradeNg2Directive((<any>${plugin})[exp]));
      `;
    }
    code += `
                }
                
              }
            }
            if (meta[0].constructor.name === 'InjectableMetadata') {
    `;
    if (this.enabledAngularJS) {
      code += `
              webend.adapter.addProvider((<any>${plugin})[exp]);
              module.factory(exp, 
                webend.adapter.downgradeNg2Provider((<any>${plugin})[exp]));
      `;
    }
    code += `
              services.push((<any>${plugin})[exp]);
            }
          }
        });
      }
    `;

    return code;
  }

  finalise() {
    let final = ``;
    if (!this.enabledAngularJS) {
      //find used template between ng2-hub tags
      let template = ``;
      if (this.config.useCustomIndexHtml) {
        let regex = /<ng2-hub>([\s\S]*)<\/ng2-hub>/;
        let dirs = regex.exec(this.config['index.html']);
        if (!dirs) {
          console.log('Add your directives between <ng2-hub> tags!');
          return;
        }
        template = dirs[1];
      } else {
        template = this.generateTemplateForPlugins();
      }
      final += `
        @Component({
          selector: 'ng2-hub',
          template: \`${template}\`,
          directives: webend.components
        })
        class ng2Hub {}

        import { bootstrap }    from '@angular/platform-browser-dynamic';
        bootstrap(ng2Hub);
      `;
    }

    return final;
  }

  autoIndexHTMLBodyContent() {
    if (this.enabledAngularJS) {
      return this.generateTemplateForPlugins();
    }
    return `<ng2-hub></ng2-hub>`;
  }

  generateTemplateForPlugins() {
    let template = ``;
    this.loadedPlugins.forEach((plugin) => {
      template += `<${plugin}></${plugin}>`;
    });
    return template;
  }

  getComponentFn() {
    return `webend.getComponent = (name: string) => {
      let found: any;
      webend.components.forEach((cmp: any) => {
        meta = Reflect.getOwnMetadata('annotations', cmp);
        if (meta && meta[0] && meta[0].selector === name) {
          found = cmp;
        }
      });
      if (found) {
        return found;
      }
      
      @Component({
        template: '',
        selector: 'webend-empty'
      })
      class WebendEmpty {}
      return WebendEmpty;
    };\n`;
  }
  
  getDirectiveFn() {
    return `webend.getDirective = (name: string) => {
      let found: any;
      webend.directives.forEach((cmp: any) => {
        meta = Reflect.getOwnMetadata('annotations', cmp);
        if (meta && meta[0] && meta[0].selector === name) {
          found = cmp;
        }
      });
      if (found) {
        return found;
      }
      
      @Directive({
        selector: 'webend-empty-directive'
      })
      class WebendEmptyDirective {}
      return WebendEmptyDirective;
    };\n`;
  }
  
  getServiceFn() {
    let code = `
      webend.getService = (name: string) => {
        let found: any;
        webend.services.forEach((srv: any) => {
          if (srv.name === name) {
            found = srv;
          }
        });
        if (found) {
          return found;
        }
        
        @Injectable()
        class WebendEmptyService {}
    `;
    if (this.enabledAngularJS) {
      code += `
        webend.adapter.addProvider(WebendEmptyService);
      `;
    }
    code += `
        return WebendEmptyService;
      };\n
    `;

    return code;
  }
}
