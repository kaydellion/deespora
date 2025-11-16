$(document).ready(function() {
  // Only initialize DataTable if table exists and is NOT on dashboard or users page
  const table = $('#myTable');
  const currentPage = window.location.pathname;
  const excludePages = ['dashboard.html', 'users.html', 'listing.html'];
  const shouldExclude = excludePages.some(page => currentPage.includes(page));
  
  if (table.length && !shouldExclude) {
    table.DataTable({
      paging: false,       // disable pagination
      searching: false,    // disable search
      info: false,         // hide "Showing X of Y entries"
      autoWidth: false,    // prevent miscalculation of widths
      responsive: true     // keep table responsive
    });
  }
});


document.addEventListener("DOMContentLoaded", function () {
  let current = location.pathname.split("/").pop(); // get current file name
  if (current === "") current = "index.html"; // default

  document.querySelectorAll(".top-pill .nav-link").forEach(link => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});


  function previewImage(input) {
    if (input.files && input.files[0]) {
      let reader = new FileReader();
      reader.onload = function(e) {
        let box = input.parentElement;
        box.innerHTML = `<img src="${e.target.result}" alt="preview">`;
      }
      reader.readAsDataURL(input.files[0]);
    }
  }