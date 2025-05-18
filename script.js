// Optional: SPA-style routing mockup
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const path = this.getAttribute('href');
    window.history.pushState({}, '', path);
    // Implement routing logic here
    console.log(`Navigated to: ${path}`);
  });
});
