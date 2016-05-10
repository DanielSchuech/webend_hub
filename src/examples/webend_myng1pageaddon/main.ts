let mod = angular.module('webend_myng1pageaddon', [])
  .directive('redLight', RedLight);
  
function RedLight() {
  return {
    link: (scope: any, el: any, attrs: any) => {
      el[0].style.backgroundColor = '#FF0000';
    }
  };
}

export default mod;
