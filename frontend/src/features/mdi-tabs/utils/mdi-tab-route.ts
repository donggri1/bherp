export function normalizeMdiPath(path: string) {
  const [withoutQuery] = path.split("?");
  const [withoutHash] = withoutQuery.split("#");

  if (withoutHash.length > 1 && withoutHash.endsWith("/")) {
    return withoutHash.slice(0, -1);
  }

  return withoutHash || "/";
}
