export async function getLogin() {
  const login = await chrome.storage.local.get(["login"]);
  return login["login"];
}
