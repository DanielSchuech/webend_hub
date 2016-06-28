import {Adapter} from './base';

export default class AngularJSAdapter implements Adapter {
  private loadedPlugins: string[] = [];
  constructor(private deps: any, private frameworks: string[]) {}

  initialise() {
    let init = `import 'angular';`;
    init += `let module = angular.module('webendApp', []);`;
    init += this.getOptNg1Service();
    init += this.getOptNg1Directive();

    //create ngAdapter if angular2 is loaded
    if (this.frameworks.indexOf('angular2') > -1) {
      init += `
        declare var webend: any;
        import 'zone.js/dist/zone';
        import 'reflect-metadata';
        import {ngAdapter} from 'ngadapter/build/ngAdapter';
        webend.adapter = new ngAdapter(module);
      `;
    }
    return init;
  }

  load(plugin: string, entryFile: string) {
    this.loadedPlugins.push(plugin);
    return `
      import '${plugin}/${entryFile}';
      module.requires.push('${plugin}');
    `;
  }

  finalise() {
    let final = ``;
    if (this.frameworks.indexOf('angular2') > -1) {
      final += `
        webend.adapter.bootstrap(document.body, ['webendApp']);
      `;
    } else {
      final += `
        angular.bootstrap(document.body, ['webendApp']);
      `;
    }

    return final;
  }

  autoIndexHTMLBodyContent() {
    let template = ``;
    this.loadedPlugins.forEach((plugin) => {
      template += `<${plugin}></${plugin}>`;
    });
    return template;
  }

  getOptNg1Service() {
    return `
      function existsNg1Service(service: string, module: angular.IModule) {
        let queue: any[] = (<any>module)._invokeQueue;
        let exists = false; 
        queue.forEach((action: any[]) => {
          if (action.length >= 3) {
            /**
             * action[0] i.e. $controllerProvider | $provide
             * action[1] i.e. register | factory | directive
             * action[2][0] name
             * action[2][1] function
             */
            if ((action[1] === 'factory' ||
              action[1] === 'service' ||
              action[1] === 'provider')
              && action[2][0] === service) {
              exists = true;
            }
          }
        });
        
        if (!exists && module.requires) {
          //not found in current module -> search in required modules
          for (let i = 0; i < module.requires.length; i++) {
            exists = existsNg1Service(service, 
              angular.module(module.requires[i]));
            if (exists) {break; }
          }
        }
        
        return exists;
      }
      
      webend.getOptNg1Service = (service: string) => {
        //check if service exists
        if (!existsNg1Service(service, module)) {
          //create empty service
          module.service(service, () => {return {}; });
        }
        
        return service;
      };
    `;
  }
  
  getOptNg1Directive() {
    return `
      function existsNg1Directive(directive: string, module: angular.IModule) {
        let queue: any[] = (<any>module)._invokeQueue;
        let exists = false; 
        queue.forEach((action: any[]) => {
          if (action.length >= 3) {
            /**
             * action[0] i.e. $controllerProvider | $provide
             * action[1] i.e. register | factory | directive
             * action[2][0] name
             * action[2][1] function
             */
            if (action[1] === 'directive' && action[2][0] === directive) {
              exists = true;
            }
          }
        });
        
        if (!exists && module.requires) {
          //not found in current module -> search in required modules
          for (let i = 0; i < module.requires.length; i++) {
            exists = existsNg1Directive(directive, 
              angular.module(module.requires[i]));
            if (exists) {break; }
          }
        }
        
        return exists;
      }
      
      webend.getOptNg1Directive = (directive: string) => {
        //check if directive exists
        if (!existsNg1Directive(directive, module)) {
          //create empty directive
          module.directive(directive, () => {return {link: () => {}}; });
        }
        
        return directive;
      };
    `;
  }
}
