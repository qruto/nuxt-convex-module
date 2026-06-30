import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  convex: {
    url: 'https://test.convex.cloud',
  },
})
