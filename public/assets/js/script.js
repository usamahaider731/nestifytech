document.addEventListener("DOMContentLoaded", function () {
  let scrollToTop = document.getElementById("scrollToTop");
  window.addEventListener("scroll", function () {
    scrollEffect(scrollToTop);
  });
  var swiper = new Swiper(".mainSlider", {
     effect: "slide",
    // grabCursor: true,
    // centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    autoplay: true,
    speed: 1500, // slower transition
    autoplay: {
      delay: 2500, // time between slides
      disableOnInteraction: true,
    }, 
      navigation: {
      nextEl: ".mainSliderNext",
      prevEl: ".mainSliderPrev",
    },
  });
});