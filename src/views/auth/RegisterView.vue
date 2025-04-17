<script setup>
import {cn} from '@//lib/utils'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
</script>

<template>
  <form :class="cn('flex flex-col gap-6')">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold text-bleu">
        Créer votre compte
      </h1>
      <p class="text-balance text-sm text-bleu">
        Entrez votre email pour vous connecter
      </p>
    </div>
    <div class="grid gap-6">
      <div class="grid gap-2 text-bleu">
        <Label for="email" class="text-bleu">Email</Label>
        <Input id="email" type="email" placeholder="m@exemple.com" required/>
      </div>
      <div class="grid gap-2">
        <div class="flex items-center">
          <Label for="password" class="text-bleu">Mot de passe</Label>
          <div
              class="ml-auto text-sm underline-offset-4 hover:underline text-bleu text-right"
          >
            <RouterLink to="forget-password">

              Mot de passe oublié ?
            </RouterLink>
          </div>
        </div>
        <Input id="password" type="password" required/>
      </div>
      <Button type="submit" class="w-full text-white bg-bleu cursor-pointer">
        Connexion
      </Button>
    </div>
    <div class="text-center text-sm text-bleu">
      Vous avez déja un compte ?
      <div class="underline underline-offset-4 text-bleu">
        <RouterLink to="login">
          Connectez-vous
        </RouterLink>
      </div>
    </div>
  </form>
</template>
