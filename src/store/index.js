import { createStore } from 'vuex'
import siteData from './siteData'
import authModule from './auth'
import auth from './auth'
import user from './user'
import { setupApiInterceptors } from '@/lib/utils'

const store = createStore({
  modules: {
    auth: authModule,
    user,
    siteData
  }
})

// Initialiser les intercepteurs avec le store
setupApiInterceptors(store)

export default store
