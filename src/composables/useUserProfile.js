import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { toast } from 'vue-sonner'

export function useUserProfile() {
    const store = useStore()

    // Loading states
    const isLoading = computed(() => store.state.user.loading)
    const isSaving = ref(false)

    // User data from store
    const user = computed(() => store.state.user.user)
    const hasComptableInfo = computed(() => store.getters['user/hasComptableInfo'])

    // Toggle state for comptable info visibility
    const showComptableInfo = ref(false)

    // Form data
    const formData = ref({
        // User info
        email: '',

        // Commercial info
        commercial_nom: '',
        commercial_prenom: '',
        commercial_fonction: '',
        commercial_tel: '',
        commercial_rue: '',
        commercial_cp: '',
        commercial_ville: '',

        // Comptable info
        comptable_nom: '',
        comptable_prenom: '',
        comptable_fonction: '',
        comptable_email: '',
        comptable_tel: '',
        comptable_rue: '',
        comptable_cp: '',
        comptable_ville: '',

        // Company info
        user_raison_sociale: '',
        user_siret: '',

        // User preferences
        user_connaissance: [],
        user_connaissance_autre: '',
        user_offre: []
    })

    /**
     * Fonction pour vider tous les champs comptables
     */
    const clearComptableFields = () => {
        formData.value.comptable_nom = ''
        formData.value.comptable_prenom = ''
        formData.value.comptable_fonction = ''
        formData.value.comptable_email = ''
        formData.value.comptable_tel = ''
        formData.value.comptable_rue = ''
        formData.value.comptable_cp = ''
        formData.value.comptable_ville = ''
    }

    /**
     * Fonction pour gérer le toggle des informations comptables
     * @param {boolean} value - L'état de la case à cocher
     */
    const toggleComptableInfo = (value) => {
        showComptableInfo.value = value

        // Si on désactive les informations comptables, on vide les champs
        if (!value) {
            clearComptableFields()
        }
    }

    /**
     * Charge les données utilisateur depuis l'API
     */
    const loadUserData = async () => {
        const result = await store.dispatch('user/fetchUserProfile')

        if (result.success && result.data) {
            const userData = result.data

            // Check if user_connaissance_autre exists, add 'autre' to connaissance list if so
            let userConnaissance = Array.isArray(userData.field_user_connaissance) ? [...userData.field_user_connaissance] : []
            if (userData.field_user_connaissance_autre && userData.field_user_connaissance_autre.trim() !== '') {
                if (!userConnaissance.includes('autre')) {
                    userConnaissance.push('autre')
                }
            }

            // Update form data from API response
            formData.value = {
                email: userData.email || '',
                commercial_nom: userData.field_commercial_nom || '',
                commercial_prenom: userData.field_commercial_prenom || '',
                commercial_fonction: userData.field_commercial_fonction || '',
                commercial_tel: userData.field_commercial_tel || '',
                commercial_rue: userData.field_commercial_rue || '',
                commercial_cp: userData.field_commercial_cp || '',
                commercial_ville: userData.field_commercial_ville || '',

                comptable_nom: userData.field_comptable_nom || '',
                comptable_prenom: userData.field_comptable_prenom || '',
                comptable_fonction: userData.field_comptable_fonction || '',
                comptable_email: userData.field_comptable_email || '',
                comptable_tel: userData.field_comptable_tel || '',
                comptable_rue: userData.field_comptable_rue || '',
                comptable_cp: userData.field_comptable_cp || '',
                comptable_ville: userData.field_comptable_ville || '',

                user_raison_sociale: userData.field_user_raison_sociale || '',
                user_siret: userData.field_user_siret || '',

                user_connaissance: userConnaissance,
                user_connaissance_autre: userData.field_user_connaissance_autre || '',
                user_offre: Array.isArray(userData.field_user_offre)
                    ? [...userData.field_user_offre]
                    : []
            }

            // Set comptable info visibility based on whether we have any comptable data
            showComptableInfo.value = hasComptableInfo.value
        }
    }

    /**
     * Sauvegarde le profil utilisateur
     */
    const saveProfile = async () => {
        isSaving.value = true

        try {
            // Prepare API data
            const apiData = {

                // Add commercial info
                field_commercial_nom: formData.value.commercial_nom,
                field_commercial_prenom: formData.value.commercial_prenom,
                field_commercial_fonction: formData.value.commercial_fonction,
                field_commercial_tel: formData.value.commercial_tel,
                field_commercial_rue: formData.value.commercial_rue,
                field_commercial_cp: formData.value.commercial_cp,
                field_commercial_ville: formData.value.commercial_ville,

                // Add company info
                field_user_raison_sociale: formData.value.user_raison_sociale,
                field_user_siret: formData.value.user_siret,

                // Add user preferences
                field_user_offre: formData.value.user_offre,

                // Add knowledge channels
                // Filter out 'autre' value if present
                field_user_connaissance: formData.value.user_connaissance.filter(item => item !== 'autre'),
            }

            // Only include user_connaissance_autre if 'autre' is selected
            if (formData.value.user_connaissance.includes('autre')) {
                apiData.field_user_connaissance_autre = formData.value.user_connaissance_autre
            }

            // Add comptable info if enabled
            if (showComptableInfo.value) {
                apiData.field_comptable_nom = formData.value.comptable_nom
                apiData.field_comptable_prenom = formData.value.comptable_prenom
                apiData.field_comptable_fonction = formData.value.comptable_fonction
                apiData.field_comptable_email = formData.value.comptable_email
                apiData.field_comptable_tel = formData.value.comptable_tel
                apiData.field_comptable_rue = formData.value.comptable_rue
                apiData.field_comptable_cp = formData.value.comptable_cp
                apiData.field_comptable_ville = formData.value.comptable_ville
            } else {
                // Clear comptable info if disabled
                apiData.comptable_nom = ''
                apiData.comptable_prenom = ''
                apiData.comptable_fonction = ''
                apiData.comptable_email = ''
                apiData.comptable_tel = ''
                apiData.comptable_rue = ''
                apiData.comptable_cp = ''
                apiData.comptable_ville = ''
            }

            const result = await store.dispatch('user/updateUserProfile', apiData)

            if (result.success) {
                toast.success('Profil mis à jour', {
                    description: 'Vos informations ont été mises à jour avec succès.',
                })
            } else {
                toast.error('Erreur lors de la mise à jour', {
                    description: result.error || 'Une erreur est survenue lors de la mise à jour de votre profil.',
                })
            }
        } catch (error) {
            console.error('Update profile error:', error)
            toast.error('Erreur lors de la mise à jour', {
                description: 'Une erreur inattendue est survenue.',
            })
        } finally {
            isSaving.value = false
        }
    }

    return {
        isLoading,
        isSaving,
        formData,
        showComptableInfo,
        loadUserData,
        saveProfile,
        toggleComptableInfo
    }
}
