//find username
const user = JSON.parse(localStorage.getItem("loggedInUser"));

document.addEventListener("DOMContentLoaded", () => {
  const themeCheckbox = document.querySelector(".theme-toggle input");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    themeCheckbox.checked = true;
  }

  themeCheckbox.addEventListener("change", () => {
    if (themeCheckbox.checked) {
      // Enable dark mode
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      // Disable dark mode
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });
});

//display username
if (user && user.role === "admin") {
  document.getElementById("welcome-message").textContent =
  `Welcome, ${user.firstName} ${user.lastName}!`;
  
  //Dropdown Name
  document.getElementById("user-fullname").textContent=
    `${user.firstName} ${user.lastName}`
} else {
  window.location.href = "login.html";
}

//remove user
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
});

// Dropdown toggle
const userBtn = document.querySelector(".user-btn")
const dropdown = document.querySelector(".dropdown-content")

userBtn.addEventListener("click",() =>{
    dropdown.classList.toggle("show");
});

// Close if clicked outside
window.addEventListener("click", (e) => {
  if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

// View Profile
document.getElementById("viewProfileBtn").addEventListener("click", () => {
  window.location.href = "admin_profile.html";
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "/index.html";
});

document.getElementById("viewReportsBtn").addEventListener("click", () => {
  window.location.href = "../AdminReport/reportpage_admin.html"; // example path
});