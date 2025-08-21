const mobileHeaderNav = document.querySelector(".headerNav");

function navButtonClick() {
    if (mobileHeaderNav.classList.contains("appear")) {
        setTimeout(() => mobileHeaderNav.classList.remove('appear'), 1000);
        document.body.classList.remove("open");
        const links = document.querySelectorAll(".sf-menu > li");
        const lis = document.querySelectorAll(".sf-menu > li li.block");

        links.forEach(link => {
            if (link.classList.contains("closed")) {
                setTimeout(() => link.classList.remove("closed"), 250);
            }
        });
        if (lis !== null) {
            lis.forEach(li => {
                li.classList.remove("block");
                li.classList.remove("open");
            });
        }
    } else {
        mobileHeaderNav.classList.add("appear");
        setTimeout(() => document.body.classList.add('open'), 100);
    }
}

document.querySelector('.menu-icon-toggle').addEventListener('click', function (e) {
    navButtonClick();
    e.preventDefault();
});

//------------------------------------------------------\\

window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    const header = document.querySelector("#header");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        header.classList.add("scroll");
    } else {
        header.classList.remove("scroll");
    }
}

window.addEventListener("resize", (event) => {
    if (document.body.classList.contains("appear") && window.innerWidth > 1024) {
        navButtonClick();
    }
});