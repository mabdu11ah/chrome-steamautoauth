import { storage } from "#imports";
import type { IAccount, ISettings, IStats } from "../types";

export const getAllAccounts = async () => {
  const accounts = await storage.getItem<IAccount[]>("local:accounts");

  return accounts ?? [];
};

export const getAccountByUsername = async (username: string) => {
  const accounts = await getAllAccounts();
  return accounts.find((account) => account.username === username);
};

export const addAccounts = async (accounts: IAccount[]) => {
  const existingAccounts = await getAllAccounts();
  const updatedAccounts = [...existingAccounts, ...accounts];
  await storage.setItem("local:accounts", updatedAccounts);
};

export const editAccountByUsername = async (
  username: string,
  account: IAccount
) => {
  const accounts = await getAllAccounts();
  const updatedAccounts = accounts.map((acc) =>
    acc.username === username ? account : acc
  );
  await storage.setItem("local:accounts", updatedAccounts);
};

export const removeAccountByUsername = async (username: string) => {
  const accounts = await getAllAccounts();
  const filteredAccounts = accounts.filter(
    (account) => account.username !== username
  );
  await storage.setItem("local:accounts", filteredAccounts);
};

export const removeAllAccounts = async () => {
  await storage.removeItem("local:accounts");
};

export const getSettings = async () => {
  const settings = await storage.getItem<ISettings>("local:settings");
  return settings ?? { enabled: true };
};

export const setSettings = async (settings: ISettings) => {
  await storage.setItem("local:settings", settings);
};

export const getStats = async () => {
  const stats = await storage.getItem<IStats>("local:stats");
  return stats ?? { totalLogins: 0 };
};

export const setStats = async (stats: IStats) => {
  await storage.setItem("local:stats", stats);
};
