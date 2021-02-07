import Vue from 'vue'
import App from './App.vue'

import 'mapbox-gl/dist/mapbox-gl.css'

// import Amplify, { Auth } from 'aws-amplify';
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
