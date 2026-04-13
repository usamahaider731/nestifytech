export function stripTags(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

export function hasPermission(user, permission) {
    if (!user || !permission) return false;
    const permissions = user?.user_permissions || [];
    return permissions.includes(permission.toLowerCase());
}
