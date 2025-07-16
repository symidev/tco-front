<script setup>
import {onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useStore} from 'vuex'
import {toast} from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const store = useStore()

onMounted(async () => {
  const token = route.params.token

  // Si l'utilisateur est déjà connecté
  if (store.state.auth.token) {
    toast.error('Vous êtes déjà connecté', {
      description: 'Vous ne pouvez pas utiliser un lien de connexion automatique lorsque vous êtes déjà connecté.'
    })
    router.push({name: 'comparos'})
    return
  }

  // Si aucun token n'est fourni dans l'URL
  if (!token) {
    toast.error('Authentification impossible', {
      description: 'Le lien d\'authentification automatique est invalide ou incomplet.'
    })
    router.push({name: 'login'})
    return
  }

  // Tenter d'authentifier avec le token
  try {
    const result = await store.dispatch('auth/autoConnect', {token})

    if (result.success) {
      toast.success('Connexion réussie', {
        description: 'Vous avez été automatiquement connecté. Veuillez changer votre mot de passe.'
      })
      
      // Charger les données partagées après auto-connect
      await store.dispatch('siteData/fetchSiteData')
      
      // Rediriger vers la page de modification du mot de passe
      router.push({name: 'password'})
    } else {
      toast.error('Échec de l\'authentification', {
        description: 'Le lien d\'authentification a expiré ou est invalide. Veuillez demander un nouveau lien.'
      })
      router.push({name: 'login'})
    }
  } catch (error) {
    console.error('Auto-connect error:', error)
    toast.error('Erreur d\'authentification', {
      description: 'Une erreur s\'est produite lors de la tentative de connexion automatique.'
    })
    router.push({name: 'login'})
  }
})
</script>

<template>
</template>
