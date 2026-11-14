// Its presence is what test/module/registration.test.ts looks for: the module
// switches Convex Auth's cookie sessions on when the server directory has this
// file. `loadNuxt` never evaluates it.
export default {}
