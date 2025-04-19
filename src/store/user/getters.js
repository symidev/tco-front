export default {
  user: state => state.user,
  loading: state => state.loading,
  error: state => state.error,
  hasComptableInfo: state => {
    if (!state.user) return false
    
    // Check if any comptable field has a value
    return [
      'field_comptable_nom',
      'field_comptable_prenom',
      'field_comptable_fonction',
      'field_comptable_tel',
      'field_comptable_rue',
      'field_comptable_cp',
      'field_comptable_ville'
    ].some(field => state.user[field] && state.user[field].trim() !== '')
  }
}