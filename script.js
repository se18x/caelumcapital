// AOS init
document.addEventListener('DOMContentLoaded',function(){if(window.AOS){AOS.init({duration:800,easing:'ease-in-out',once:true,offset:100});}});// Smooth scroll helper
function scrollToSection(e){const t=document.getElementById(e);t&&t.scrollIntoView({behavior:'smooth',block:'start'})}window.addEventListener('scroll',()=>{const e=document.querySelector('.navbar');if(!e)return;window.scrollY>50?(e.style.background='rgba(255,255,255,0.98)',e.style.boxShadow='0 2px 20px rgba(0,0,0,0.1)'):(e.style.background='rgba(255,255,255,0.95)',e.style.boxShadow='none')});


