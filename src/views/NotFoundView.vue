<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page non trouvée</p>
    <router-link to="/">Retour à l'accueil</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

h1 {
  font-size: 6rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}
</style>