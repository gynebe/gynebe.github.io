const imgContent=Array.from(document.querySelectorAll(".box6 img")),sld=document.querySelector(".slider"),bulletsContainer=sld.querySelector(".sliderBullets"),bull=Array.from(bulletsContainer.children),sldChildren=sld.querySelector(".slides"),backgroundCover=document.querySelector(".backgroundCover"),headerClose=document.querySelector("#header");function showImgContent(e){x=e.offsetX,y=e.offsetY;let t=e.target.closest("img").nextElementSibling;null==t&&console.log("yaaaa"),"none"===t.style.display&&(t.style.display="block"),t.style.transform=`translate3d(${x}px, ${y}px, 0)`}function notShowImgContent(e){e.target.closest("img").nextElementSibling.style.display="none"}function carousel(e){const t=e.target.closest("img"),s=bulletsContainer.querySelector(".currentSlide");e=imgContent.findIndex(e=>e===t);sldChildren.style.setProperty("left",`${-100*(e+1)}%`),s.classList.remove("currentSlide"),bull[e].classList.add("currentSlide"),index=e,backgroundCover.classList.add("active"),setTimeout(()=>sld.classList.add("transition"),100),window.innerHeight<550&&(headerClose.classList.add("close"),sld.style.height="90%",sld.style.top="50%")}function closeCarousel(){sld.classList.remove("transition"),setTimeout(()=>backgroundCover.classList.remove("active"),100),window.innerHeight<550&&(headerClose.classList.remove("close"),1950<window.innerWidth?sld.style.height="80%":1336<window.innerWidth?sld.style.height="70%":501<window.innerWidth?sld.style.height="60%":sld.style.height="40%",sld.style.top="55%")}imgContent.forEach(e=>{e.addEventListener("mousemove",showImgContent),e.addEventListener("wheel",notShowImgContent),e.addEventListener("mouseleave",notShowImgContent),e.addEventListener("click",carousel)}),window.addEventListener("resize",e=>{window.innerHeight<550&&backgroundCover.classList.contains("active")?(headerClose.classList.add("close"),sld.style.height="90%",sld.style.top="50%"):(headerClose.classList.remove("close"),1950<window.innerWidth?sld.style.height="80%":1336<window.innerWidth?sld.style.height="70%":501<window.innerWidth?sld.style.height="60%":sld.style.height="40%",sld.style.top="55%")}),backgroundCover.addEventListener("click",closeCarousel);