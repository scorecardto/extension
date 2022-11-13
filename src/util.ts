export async function getLogin() {
  const login = await chrome.storage.local.get(["login"]);
  return login["login"];
}

export function AorAn(count: string) {
  // if can be parsed as a number, use that
  if (!isNaN(parseInt(count))) {
    if (count.toString().startsWith("8")) {
      return "an";
    } else {
      return "a";
    }
  }
  // if starts with a vowel, use an
  else if (
    count.toLowerCase().startsWith("a") ||
    count.toLowerCase().startsWith("e") ||
    count.toLowerCase().startsWith("i") ||
    count.toLowerCase().startsWith("o") ||
    count.toLowerCase().startsWith("u")
  ) {
    return "an";
  }
  // otherwise use a
  else {
    return "a";
  }
}

export function pluralize(count: number) {
  if (count === 1) {
    return "";
  } else {
    return "s";
  }
}
