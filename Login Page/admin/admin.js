//find username
const user = JSON.parse(localStorage.getItem("loggedInUser"));

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
  alert("Profile page not yet created!");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "../login.html";
});