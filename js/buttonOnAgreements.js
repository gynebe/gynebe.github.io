const buttons=document.querySelectorAll("button"),body=document.querySelector("body"),overlay=body.querySelector(".overlay");buttons.forEach(e=>e.addEventListener("click",e=>{const t=e.target.closest("button").parentElement.nextElementSibling;let s=t.querySelectorAll(".insurence");t.classList.contains("appear")?t.classList.remove("appear"):setTimeout(()=>t.classList.add("appear"),100),t.classList.toggle("active"),setTimeout(()=>t.classList.toggle("transition"),100),s.forEach(e=>e.classList.toggle("active"))}));