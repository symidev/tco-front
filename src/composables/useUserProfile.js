import {ref, computed} from 'vue'
import {useStore} from 'vuex'

export function useUserProfile(toast) {
    const store = useStore()

    // Loading states
    const isLoading = computed(() => store.state.user.loading)
    const isSaving = ref(false)

    // User data from store
    const user = computed(() => store.state.user.user)
    const hasComptableInfo = computed(() => store.getters['user/hasComptableInfo'])

    // Toggle state for comptable info visibility
    const showComptableInfo = ref(false)

    const validationActive = ref(false)

    // Déclarer les références aux composants
    const companyInfoRefObject = ref(null)
    const commercialInfoRefObject = ref(null)
    const accountingInfoRefObject = ref(null)


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

        // User IS et charges patronales
        user_is: '',
        user_charge_patronale: '',

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

    const validateForm = () => {
        // Activer la validation pour afficher les erreurs dans les composants enfants
        validationActive.value = true
        let isValid = true
        let errorMessage = ''

        // Vérifier d'abord que les références existent
        const hasCompanyInfoRef = companyInfoRefObject.value && typeof companyInfoRefObject.value === 'object'
        const hasCommercialInfoRef = commercialInfoRefObject.value && typeof commercialInfoRefObject.value === 'object'
        const hasAccountingInfoRef = accountingInfoRefObject.value && typeof accountingInfoRefObject.value === 'object'

        // Validation du SIRET
        if (hasCompanyInfoRef && typeof companyInfoRefObject.value.validateSiret === 'function') {
            const isSiretValid = companyInfoRefObject.value.validateSiret()
            if (!isSiretValid) {
                isValid = false
                errorMessage = "Le SIRET doit contenir 14 chiffres"
            }
        }

        // Validation du téléphone de l'entreprise
        if (hasCompanyInfoRef && typeof companyInfoRefObject.value.validateTel === 'function') {
            const isTelValid = companyInfoRefObject.value.validateTel()
            if (!isTelValid) {
                isValid = false
                errorMessage = "Le téléphone de l'entreprise doit contenir 10 chiffres"
            }
        }

        // Validation du téléphone commercial
        if (hasCommercialInfoRef && typeof commercialInfoRefObject.value.validate === 'function') {
            const isCommercialTelValid = commercialInfoRefObject.value.validate()
            if (!isCommercialTelValid) {
                isValid = false
                errorMessage = "Le téléphone commercial doit contenir 10 chiffres"
            }
        }

        // Validation du téléphone comptable si affiché
        if (showComptableInfo.value && hasAccountingInfoRef && typeof accountingInfoRefObject.value.validate === 'function') {
            const isComptableTelValid = accountingInfoRefObject.value.validate()
            if (!isComptableTelValid) {
                isValid = false
                errorMessage = "Le téléphone comptable doit contenir 10 chiffres"
            }
        }

        // Validation de l'intérêt de l'offre
        if (hasCompanyInfoRef && typeof companyInfoRefObject.value.validateOffre === 'function') {
            const isOffreValid = companyInfoRefObject.value.validateOffre()
            if (!isOffreValid) {
                isValid = false
                errorMessage = "Veuillez sélectionner au moins un intérêt pour l'offre"
            }
        }

        // Validation du canal de connaissance
        if (hasCompanyInfoRef && typeof companyInfoRefObject.value.validateConnaissance === 'function') {
            const isConnaissanceValid = companyInfoRefObject.value.validateConnaissance()
            if (!isConnaissanceValid) {
                isValid = false
                errorMessage = "Veuillez sélectionner au moins un canal de connaissance"
            }
        }

        if (!isValid && errorMessage) {
            toast.add({
                severity: 'warn',
                summary: errorMessage,
                life: 10000
            })
        } else if (isValid) {

        }

        return isValid
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
                user_is: userData.field_user_is || 28,
                user_charge_patronale: userData.field_user_charge_patronale || 48,

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
        // Valider le formulaire avant de soumettre
        if (!validateForm()) {
            return
        }

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
                field_user_is: formData.value.user_is,
                field_user_charge_patronale: formData.value.user_charge_patronale,

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
                toast.add({
                    severity: 'success',
                    summary: 'Profil mis à jour',
                    detail: 'Vos informations ont été mises à jour avec succès.',
                    life: 3000
                })
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Erreur lors de la mise à jour',
                    detail: result.error || 'Une erreur est survenue lors de la mise à jour de votre profil.',
                    life: 3000
                })
            }
        } catch (error) {
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
        toggleComptableInfo,
        validationActive,
        // Exposer les setters pour les références avec vérification
        setCompanyInfoRef: (el) => {
            companyInfoRefObject.value = el;
        },
        setCommercialInfoRef: (el) => {
            commercialInfoRefObject.value = el;
        },
        setAccountingInfoRef: (el) => {
            accountingInfoRefObject.value = el;
        }
    }
}
