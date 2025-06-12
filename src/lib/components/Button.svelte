<script lang="ts">
  import { fade } from "svelte/transition";

  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let onclick: () => void = () => {};
</script>

<button
  class="h-10 mt-2 w-full rounded-lg bg-purple-600 p-2 text-white font-bold
  flex items-center justify-center shadow-inner shadow-white/30 text-sm
  hover:bg-purple-700 transition-colors duration-200 cursor-pointer disabled:opacity-50
  disabled:cursor-not-allowed"
  {disabled}
  {onclick}
>
  <div class="grid">
    {#if loading}
      <div
        class="col-span-full row-span-full size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
        in:fade={{ duration: 200, delay: 200 }}
        out:fade={{ duration: 200 }}
      >
        <span class="sr-only">Loading...</span>
      </div>
    {:else}
      <div
        class="col-span-full row-span-full"
        in:fade={{ duration: 200, delay: 200 }}
        out:fade={{ duration: 200 }}
      >
        <slot />
      </div>
    {/if}
  </div>
</button>
