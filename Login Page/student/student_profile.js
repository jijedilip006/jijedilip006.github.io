const user = JSON.parse(localStorage.getItem("loggedInUser"));

if (!user || user.role !== "student") {
  // redirect to login if not logged in
  window.location.href = "../login.html";
}

// Populate Profile Details
const profileDetails = document.querySelector(".profile-details");
profileDetails.innerHTML = `
  <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
  <p><strong>Email:</strong> ${user.email}</p>
  <p><strong>Classroom ID:</strong> ${user.classroomId || "Not Assigned"}</p>
  <p><strong>Date of Birth:</strong> ${user.dob || "Not Provided"}</p>
`;

// Handle Buttons

// Back button -> go back to dashboard
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "student.html";
});

// Edit Profile button (future feature)
document.getElementById("editProfileBtn").addEventListener("click", () => {
  alert("Edit profile feature coming soon!");
});

// Fetch Courses Enrolled
(async () => {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, owner, lesson_ids")
    .contains("Students_Enrolled", JSON.stringify([user.email]));

  const container = document.getElementById("courses-list");

  if (error) {
    console.error("Error fetching courses:", error);
    container.innerHTML += `<p>Error loading courses.</p>`;
    return;
  }

  if (!courses || courses.length === 0) {
    container.innerHTML += `<p>No courses enrolled.</p>`;
  } else {
    courses.forEach(c => {
      container.innerHTML += `
        <div class="course-box">
          <p><strong>${c.id}:</strong> ${c.title || "Untitled Course"}</p>
          <p><strong>Owner:</strong> ${c.owner}</p>
        </div>
      `;
    });
  }

  // Fetch Lessons Enrolled

  const lessonsContainer = document.getElementById("lessons-list");
  let lessonIds = [];
  courses.forEach(c => {
    if (c.lesson_ids) lessonIds = lessonIds.concat(c.lesson_ids);
  });

  if (lessonIds.length === 0) {
    lessonsContainer.innerHTML += `<p>No lessons enrolled.</p>`;
  } else {
    const { data: lessons, error: lessonError } = await supabase
      .from("lessons")
      .select("id, title, creditPoints")
      .in("id", lessonIds);

    if (lessonError) {
      console.error("Error fetching lessons:", lessonError);
      lessonsContainer.innerHTML += `<p>Error loading lessons.</p>`;
      return;
    }

    lessons.forEach(l => {
      lessonsContainer.innerHTML += `
        <div class="lesson-box">
          <p><strong>${l.id}:</strong> ${l.title || "Untitled Lesson"} (${l.creditPoints} pts)</p>
        </div>
      `;
    });
  }
})();