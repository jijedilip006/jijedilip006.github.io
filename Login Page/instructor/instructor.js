//find username
const user = JSON.parse(localStorage.getItem("loggedInUser"));

//display username
if (user && user.role === "instructor") {
  // Welcome message
  document.getElementById("welcome-message").textContent =
    `Welcome, ${user.firstName} ${user.lastName}!`;

  // Dropdown name
  document.getElementById("user-fullname").textContent =
    `${user.firstName} ${user.lastName}`;
} else {
  window.location.href = "login.html";
}


// Dropdown toggle
const userBtn = document.querySelector(".user-btn");
const dropdown = document.querySelector(".dropdown-content");

userBtn.addEventListener("click", () => {
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
  window.location.href = "instructor_profile.html";
});

// View Student
document.getElementById("viewStudentBtn").addEventListener("click", () => {
  window.location.href = "../../InstructorStudentsPage/student_page.html";
});


// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "/index.html";
});


(async () => {
  const container = document.getElementById("course-status");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  const { data, error } = await supabase
    .from("courses")
    .select("id, owner, lesson_ids, Students_Enrolled, description, Instructor")
    .contains("Instructor",JSON.stringify([user.email]));

  if (error) {
    console.error("Error checking enrollment:", error);
    container.textContent = "Error loading course info.";
    return;
  }

  if (!data || data.length === 0) {
    // not enrolled in any course, show course enroll
    container.innerHTML = `
      <div class="enroll-box">
        <h2>You are not teaching any course.</h2>
      </div>
    `;
  } else {
        // show all courses instructor is teaching
    container.innerHTML = data.map(c => `
      <div class="course-box">
        <p><strong>${c.id}</strong></p>
        <p>Owner: ${c.owner}</p>
      </div>
    `).join('');
  }
})();

