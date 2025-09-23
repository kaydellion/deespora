$(document).ready(function() {
  var table = $('#myTable').DataTable({
    paging: false,       // disable pagination
    searching: false,    // disable search
    info: false,         // hide "Showing X of Y entries"
    autoWidth: false,    // prevent miscalculation of widths
    responsive: true     // keep table responsive
  });

  // force adjust after draw
  table.columns.adjust().draw();
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