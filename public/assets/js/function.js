function $(attribute) {
  return document.querySelectorAll(attribute);
}
function scrollEffect(attribute) {
  let scrollTop = window.scrollY || document.documentElement.scrollTop;

  if (scrollTop >= window.innerHeight * 1.1) {
    console.log("Show");  
    attribute.classList.add("opacity-100", "translate-y-0");
    attribute.classList.remove("opacity-0", "translate-y-10");
  } else {
    console.log("Hide"); 
    attribute.classList.add("opacity-0", "translate-y-10");
    attribute.classList.remove("opacity-100", "translate-y-0");
  }
}