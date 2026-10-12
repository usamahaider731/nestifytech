export function stripTags(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false;
  // Administrator role has unrestricted access to everything
  // user_role is an array of role title strings e.g. ["Administrator"]
  const userRoles = Array.isArray(user?.user_role) ? user.user_role : [];
  if (userRoles.includes('Administrator')) return true;
  const permissions = user?.user_permissions || [];
  return permissions.includes(permission.toLowerCase());
}

export function html_print(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerHTML || "";
}