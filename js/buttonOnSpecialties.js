const containers=document.querySelectorAll("button"),body=document.querySelector("body"),overlay=body.querySelector(".overlay");function removeUl(e,t){e.classList.remove("active"),setTimeout(()=>e.classList.remove("transition"),100),t.forEach(e=>e.classList.remove("active"))}window.addEventListener("resize",e=>{if(""!==overlay.style.height&&"0px"!==overlay.style.height){overlay.style.setProperty("height","0px"),overlay.style.setProperty("width","0px");const o=body.querySelector("ul.active");var t=o.querySelectorAll("li");removeUl(o,t)}}),overlay.addEventListener("click",()=>{overlay.style.setProperty("height","0px"),overlay.style.setProperty("width","0px");const e=body.querySelector("ul.active");var t;null!==e&&(t=e.querySelectorAll("li"),removeUl(e,t))}),containers.forEach(e=>e.addEventListener("click",e=>{const o=e.target.closest("button").nextElementSibling;containers.forEach(e=>{const t=e.nextElementSibling;e=t.querySelectorAll("li");o!==t&&t.classList.contains("active")&&removeUl(t,e)}),overlay.style.setProperty("height",`${body.offsetHeight}px`),overlay.style.setProperty("width",`${body.offsetWidth}px`);let t=o.querySelectorAll("li");o.classList.toggle("active"),setTimeout(()=>o.classList.toggle("transition"),100),t.forEach(e=>e.classList.toggle("active"))}));