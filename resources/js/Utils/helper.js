export function stripTags(html = "") {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
}
