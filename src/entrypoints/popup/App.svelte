<script lang="ts">
  import { fade } from "svelte/transition";

  import Header from "@/lib/components/Header.svelte";
  import TabBar from "@/lib/components/TabBar.svelte";
  import Icon from "@iconify/svelte";

  import type { IAccount, ISettings } from "@/types";
  import {
    addAccounts,
    removeAccountByUsername,
    getAllAccounts,
    getStats,
    getSettings,
    setSettings,
  } from "../../lib/storage";
  import { generateAuthCode } from "../../lib/totp";
  import Button from "@/lib/components/Button.svelte";
  import Toggle from "@/lib/components/Toggle.svelte";

  let currentView = $state<"home" | "add-account" | "settings">("home");

  // home
  let accounts = $state<IAccount[]>([]);
  let logins = $state(0);
  let settings = $state<ISettings | null>(null);

  let accountCodes = $state<Record<string, string>>({});
  let accountCodesTimer = $state<Record<string, number>>({});

  async function fetchState() {
    accounts = await getAllAccounts();
    logins = await getStats().then((stats) => stats.totalLogins);
    settings = await getSettings();
  }

  function updateAccountCodes() {
    accounts.forEach((account) => {
      if (account.sharedSecret) {
        const code = generateAuthCode(account.sharedSecret);
        const hasCodeChanged = accountCodes[account.username] !== code;

        if (hasCodeChanged) {
          // First time generating code, so figure out how much time left
          if (!accountCodes[account.username]) {
            let offsetSeconds = 1;
            let offsetCode = code;

            while (offsetCode === code) {
              offsetCode = generateAuthCode(
                account.sharedSecret,
                offsetSeconds
              );
              offsetSeconds++;
            }

            accountCodes[account.username] = code;
            accountCodesTimer[account.username] = 30 - offsetSeconds;
          } else {
            accountCodes[account.username] = code;
            accountCodesTimer[account.username] = 0;
          }
        } else {
          accountCodesTimer[account.username]++;
        }
      }
    });
  }

  $effect(() => {
    fetchState();

    const intervalId = setInterval(() => {
      updateAccountCodes();
    }, 1000);

    return () => clearInterval(intervalId);
  });

  let loading = $state(false);

  let username = $state("");
  let password = $state("");
  let sharedSecret = $state("");

  let bulk = $state(false);
  let bulkText = $state("");
  let validBulkAccounts = $derived(
    bulkText
      .split("\n")
      .filter((line) => line.trim() !== "" && line.includes(":")).length
  );

  async function handleAddAccount() {
    loading = true;
    try {
      if (bulk) {
        const accounts = bulkText.split("\n").map((line) => {
          if (line.trim() === "" || !line.includes(":")) return null;

          const [username, password, sharedSecret] = line.split(":");

          return {
            username,
            password,
            sharedSecret,
          };
        });

        await addAccounts(accounts.filter((account) => account !== null));
      } else {
        await addAccounts([
          {
            username,
            password,
            sharedSecret,
          },
        ]);
      }

      await fetchState();
    } finally {
      currentView = "home";

      username = "";
      password = "";
      sharedSecret = "";
      bulk = false;
      bulkText = "";

      loading = false;
    }
  }

  async function handleDeleteAccount(username: string) {
    await removeAccountByUsername(username);
    await fetchState();
  }

  async function handleEnableToggle() {
    settings!.enabled = !settings!.enabled;
    await setSettings(settings!);
    await fetchState();
  }
</script>

<main class="h-full">
  <Header />

  <div class="grid gap-6 pb-12 overflow-y-scroll h-full relative">
    {#key currentView}
      <div
        class="col-span-full row-span full p-4"
        in:fade={{ duration: 100, delay: 100 }}
        out:fade={{ duration: 100 }}
      >
        {#if currentView === "home"}
          <div class="flex flex-col gap-2">
            <h1 class="text-xl font-bold">Home</h1>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-green-700 rounded-lg p-2 relative overflow-hidden">
                <Icon
                  icon="basil:user-solid"
                  class="size-20 opacity-50 absolute -bottom-6 -right-6"
                />

                <div class="flex items-center gap-2">
                  <span class="font-medium text-base">Accounts</span>
                </div>

                <div class="text-2xl tracking-tighter font-bold">
                  {accounts.length}
                </div>
              </div>
              <div
                class="bg-yellow-600 rounded-lg p-2 relative overflow-hidden"
              >
                <Icon
                  icon="basil:login-solid"
                  class="size-20 opacity-50 absolute -bottom-6 -right-6"
                />
                <div class="flex items-center gap-2">
                  <span class="font-medium text-base">Logins</span>
                </div>

                <div class="text-2xl tracking-tighter font-bold">{logins}</div>
              </div>
            </div>

            <Button onclick={() => (currentView = "add-account")}>
              Add Account
            </Button>

            <div class="mt-2">
              <h2 class="text-lg font-bold">Accounts</h2>

              {#if accounts.length === 0}
                <div
                  class="w-full flex flex-col items-center justify-center p-4 bg-purple-600/20 mt-2 rounded-lg"
                >
                  <Icon
                    icon="basil:info-circle-solid"
                    class="size-8 text-purple-400"
                  />

                  <span
                    class="text-base font-medium text-center mt-1 text-purple-400"
                  >
                    No accounts yet. Add an account to get started.
                  </span>
                </div>
              {/if}

              <div class="flex flex-col gap-3 mt-2">
                {#each accounts as account}
                  <div class="bg-zinc-700 rounded-lg p-4">
                    <div>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <div
                            class="rounded-full size-6 bg-purple-600 border border-purple-500
                          flex items-center justify-center"
                          >
                            <span class="text-sm text-purple-200 font-bold">
                              {account.username.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <span class="text-sm font-medium">
                            {account.username}
                          </span>
                        </div>

                        <button
                          class="size-6 flex items-center justify-center text-xs bg-red-500/20 font-medium text-red-400 hover:bg-red-500/30 rounded-full cursor-pointer"
                          onclick={() => handleDeleteAccount(account.username)}
                        >
                          <Icon icon="basil:trash-solid" />
                        </button>
                      </div>

                      {#if accountCodes[account.username]}
                        <div
                          class="text-sm font-bold mt-3 pt-4 text-center border-t border-zinc-600 flex items-center gap-1 justify-center"
                        >
                          {accountCodes[account.username]}
                          <button
                            class="cursor-pointer hover:scale-110 transition-all duration-300"
                            onclick={() => {
                              navigator.clipboard.writeText(
                                accountCodes[account.username]
                              );
                            }}
                          >
                            <Icon icon="basil:copy-solid" />
                          </button>
                        </div>
                        <div
                          class="w-full bg-zinc-600 rounded-lg h-2 mt-2 relative"
                        >
                          <div
                            class="w-full bg-green-600 transition-all duration-300 rounded-lg h-2 mt-2 relative"
                            style="width: {((30 -
                              accountCodesTimer[account.username]) /
                              30) *
                              100}%"
                          ></div>
                        </div>
                      {/if}
                    </div>

                    <!-- <pre>{JSON.stringify(account, null, 2)}</pre> -->
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {:else if currentView === "add-account"}
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <h1 class="text-xl font-bold">Add Account</h1>

              <button
                class="text-sm bg-purple-500/20 font-medium text-purple-400 hover:bg-purple-500/30 rounded-full px-4 py-1.5 cursor-pointer"
                onclick={() => (bulk = !bulk)}
              >
                Add {bulk ? "Single" : "Bulk"}
              </button>
            </div>

            <div class="flex flex-col gap-2">
              {#if !bulk}
                <label for="username" class="text-sm font-medium">
                  Username*
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  class="w-full rounded-lg p-2 bg-zinc-700"
                  bind:value={username}
                />
                <label for="password" class="text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  class="w-full rounded-lg p-2 bg-zinc-700"
                  bind:value={password}
                />
                <label for="shared-secret" class="text-sm font-medium">
                  Shared Secret
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Shared Secret"
                  class="w-full rounded-lg p-2 bg-zinc-700"
                  bind:value={sharedSecret}
                />
              {:else}
                <label for="bulk-text" class="text-sm font-medium">
                  Accounts
                </label>
                <textarea
                  rows={10}
                  placeholder="Username:Password:SharedSecret"
                  class="w-full rounded-lg p-2 bg-zinc-700"
                  bind:value={bulkText}
                ></textarea>
              {/if}

              <Button
                disabled={(bulk && validBulkAccounts === 0) ||
                  (!bulk && !(username && password))}
                onclick={handleAddAccount}
                {loading}
              >
                Add {bulk ? `${validBulkAccounts} Account(s)` : "Account"}
              </Button>
            </div>
          </div>
        {:else if currentView === "settings"}
          <div class="flex flex-col gap-2">
            <h1 class="text-xl font-bold">Settings</h1>

            <div class="mt-2">
              <div class="flex items-center justify-between">
                <span class="text-base font-medium">Auto Login</span>
                <Toggle
                  toggleThreshold={0}
                  onChange={handleEnableToggle}
                  checked={settings?.enabled}
                />
              </div>

              <div class="text-sm text-zinc-400 mt-2">
                Disabling this will stop the extension from automatically
                logging in to your accounts. Refresh login page to apply
                changes.
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/key}

    <!-- <Toast message="Account added successfully" type="success" show={true} /> -->
  </div>

  <TabBar {currentView} onViewChange={(view) => (currentView = view)} />
</main>

<style>
</style>
