<script lang="ts" setup>
const router = useRouter();
const authStore = useAuthStore();

const error = ref<string | null>(null);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: "",
    password: "",
  },
});

const onSubmit = handleSubmit(async (values) => {
  error.value = null;
  try {
    await authStore.login(values.email, values.password);
    await router.replace("/app");
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to sign in.";
  }
});
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader class="space-y-1">
      <CardTitle class="text-2xl font-bold text-center">Sign In</CardTitle>
      <CardDescription class="text-center">
        Enter your credentials to access your account
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form id="login-form" class="grid gap-4" @submit="onSubmit">
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <FormField v-slot="{ componentField }" name="email">
          <FormItem class="space-y-2">
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="name@example.com"
              v-bind="componentField"
              autocomplete="email"
              :disabled="isSubmitting"
            />
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem class="space-y-2">
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Password"
              v-bind="componentField"
              autocomplete="current-password"
              :disabled="isSubmitting"
            />
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Submit Button -->
        <Button type="submit" class="w-full" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <svg
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Signing in...
          </span>
          <span v-else>Sign In</span>
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
