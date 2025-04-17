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
        Mot de passe oublié ?
      </h1>
      <p class="text-balance text-sm text-bleu">
        Entrez votre email pour réinitialiser votre mot de passe
      </p>
    </div>
    <div class="grid gap-6">
      <div class="grid gap-2 text-bleu">
        <Label for="email" class="text-bleu">Email</Label>
        <Input id="email" type="email" placeholder="m@exemple.com" required/>
      </div>
      <Button type="submit" class="w-full text-white bg-bleu">
        Connexion
      </Button>
    </div>
    <div class="text-center text-sm text-bleu">
      Vous n'avez pas encore de compte ?
      <div>
        <RouterLink to="register">
          <div class="underline underline-offset-4 text-bleu">
            Inscrivez-vous
          </div>
        </RouterLink>

      </div>
    </div>
  </form>
</template>
