<script lang="ts">
  import type { View } from "../../types";
  import Icon from "@iconify/svelte";

  let views: Record<View, { icon: string; label: string }> = {
    home: { icon: "basil:home", label: "Home" },
    "add-account": { icon: "basil:add", label: "Add Account" },
    settings: { icon: "basil:settings", label: "Settings" },
  };

  export let currentView: View = "home";
  export let onViewChange: (view: View) => void;
</script>

<div
  class="w-full flex items-center justify-center px-4 bg-zinc-800
  fixed bottom-0 left-0 right-0 h-12 border-t border-zinc-700"
>
  <div class="w-full grid grid-cols-3">
    {#each Object.keys(views) as view}
      <button
        class="flex items-center justify-center
        hover:scale-110 group cursor-pointer transition-all duration-300"
        onclick={() => onViewChange(view as View)}
      >
        <Icon
          icon={views[view as View].icon +
            (currentView === view ? "-solid" : "-outline")}
          class="size-6 {currentView === view ? 'text-white' : 'text-gray-300'}"
        />
      </button>
    {/each}
  </div>
</div>
