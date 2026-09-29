import { httpRouter } from 'convex/server'
import { upload, uploadPreflight } from './files'

// The site's one HTTP route: the playground's upload endpoint, where every
// URL from `files.generateUploadUrl` points (files.ts says why).
const http = httpRouter()

http.route({ path: '/upload', method: 'POST', handler: upload })
http.route({ path: '/upload', method: 'OPTIONS', handler: uploadPreflight })

export default http
