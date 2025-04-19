import { createStore } from 'vuex'
import auth from './auth'
import user from './user'
import { setupApiInterceptors } from '@/lib/utils'

const store = createStore({
  modules: {
    auth,
    user
  }
})

// Initialiser les intercepteurs avec le store
setupApiInterceptors(store)

export default store