export function criarCabecalhosAparelho(
  sistema: string,
  versao: string | number,
): Record<string, string> {
  const ios = sistema === "ios";
  return {
    "X-Device-Type": ios ? "MOBILE_IOS" : "MOBILE_ANDROID",
    "X-Device-Name": `${ios ? "iOS" : "Android"} ${String(versao)}`,
  };
}
