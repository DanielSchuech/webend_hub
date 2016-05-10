let mod = angular.module('webend_myng1page', [])
  .directive('webendMyng1page', MyNg1Page);

declare var window: any;

ctrl.$inject = [window.getOptNg1Service('MyPageService'), '$scope'];
function ctrl(MyPageService: any, $scope: any) {
  $scope.secret = MyPageService.secret;
}

function MyNg1Page() {
  return {
    template: `
      <div>
        Hello from the old AngularJS World!
        {{secret}}
        <div red-light>This is a Highlight!</div>
      </div>
    `,
    controller: ctrl
  };
}

export default mod;
