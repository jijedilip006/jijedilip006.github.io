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
if (user && user.role === "student") {
  // Welcome Message
  document.getElementById("welcome-message").textContent =
    `Welcome, ${user.firstName} ${user.lastName}!`;
  
  //Dropdown Name
  document.getElementById("user-fullname").textContent=
    `${user.firstName} ${user.lastName}`
} else {
  window.location.href = "../login.html";
}

//remove user
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
});

// View Profile
document.getElementById("viewProfileBtn").addEventListener("click", () => {
  window.location.href = "student_profile.html";
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

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("loggedInUser");
  window.location.href = "/index.html";
});

async function unenroll(courseId,userEmail) {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("Students_Enrolled")
    .eq("id", courseId)
    .single();

  if (courseError) {
    console.error("Error fetching course:", courseError);
    alert("Failed to unenroll. See console for details.");
    return;
  }

  const currentStudents = course.Students_Enrolled || [];

  const updatedStudents = currentStudents.filter(email => email !== userEmail);

  const { error: updateError } = await supabase
    .from("courses")
    .update({ Students_Enrolled: updatedStudents })
    .eq("id", courseId);

  if (updateError) {
    console.error("Error unenrolling from course:", updateError);
    alert("Failed to unenroll. See console for details.");
    return;
  }

  alert("Successfully unenrolled from course.");
  window.location.reload();
}

(async () => {
  const container = document.getElementById("course-status");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  const { data, error } = await supabase
    .from("courses")
    .select("id, owner, lesson_ids, Students_Enrolled, description,title")
    .contains("Students_Enrolled", JSON.stringify([user.email]));

  if (error) {
    console.error("Error checking enrollment:", error);
    container.textContent = "Error loading course info.";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="enroll-box">
        <h2>You are not enrolled in any course.</h2>
        <a href="./course_enrol/course_enrol.html" class="button">Enroll in a Course</a>
      </div>
    `;
  } else {
    const c = data[0];   
    let totalCredits = 0;
    if (c.lesson_ids && c.lesson_ids.length > 0) {
      const { data: lessons, error: lessonError } = await supabase
        .from("lessons")
        .select("creditPoints")
        .in("id", c.lesson_ids);

      if (lessonError) {
        console.error(`Error fetching lessons for course ${c.id}:`, lessonError);
      } else if(lessons){
        totalCredits = lessons.reduce((sum, lesson) => sum + (lesson.creditPoints || 0), 0);
      }
    container.innerHTML = `
      <div class="course-box" id="course-card" style="cursor:pointer">
        <p class="course-id"><strong>${c.id}</strong></p>
        <p><strong>Title:</strong> ${c.title || "Untitled Course"}</p>
        <p><strong>Total Credit Points:</strong> ${totalCredits}</p>
        <p><strong>Owner:</strong> ${c.owner}</p>
        <small>Click to view lessons</small><br>
        
      </div>
      <center><button id="unenroll-btn" class="unenroll-btn">Unenroll</button></center>
      
    `;

    document.getElementById("course-card").addEventListener("click", () => {
      window.location.href = `./lesson_students/student_lessons.html?courseId=${encodeURIComponent(c.id)}`;
    });

    document.getElementById("unenroll-btn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to unenroll from ${c.id}?`)){
        unenroll(c.id, user.email);}
    });
  }
}
})();

(async () => {
  const container = document.getElementById("classroom-status");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Fetch all classrooms the student is enrolled in
  const { data, error } = await supabase
    .from("classrooms")
    .select('classroom_id, title, owner, start_date, duration, students, course_list, "Draft Mode", Archived')
    .contains("students", JSON.stringify([user.email]));

  if (error) {
    console.error("Error fetching classrooms:", error);
    container.textContent = "Error loading classroom info.";
    return;
  }

  //Filter out Draft or Archived classrooms
  const activeClassrooms = (data || []).filter(
    (cls) => !cls["Draft Mode"] && !cls["Archived"]
  );

  if (!data || activeClassrooms.length === 0) {
    container.innerHTML = `
      <div class="no-classroom">
        <p>You are not enrolled in any classroom.</p>
        <a href="../../StudentClassroomPage/student_classroom.html" class="enroll-btn">Join a Classroom</a>
        <a href="../../StudentAccessClassroom/student_access_classroom.html" class="enroll-btn">View all grades</a>
      </div>
    `;
    return;
  }

  // Render all enrolled classrooms
  container.innerHTML = activeClassrooms
    .map(
      (cls) => `
      <div class="course-box" id="classrooms-card" style="cursor:pointer">
        <p><strong>Classroom ID:</strong> ${cls.classroom_id}</p>
        <p><strong>Title:</strong> ${cls.title || "Untitled"}</p>
        <p><strong>Owner:</strong> ${cls.owner}</p>
        <p><strong>Start Date:</strong> ${cls.start_date || "N/A"}</p>
        <p><strong>Duration:</strong> ${cls.duration || "N/A"} week(s)</p>
        <p><strong>Course:</strong> ${cls.course_list || "N/A"}</p>
        <small>Click to view details</small><br>

        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
          <a href="../../StudentAccessClassroom/student_access_classroom.html" class="enroll-btn">View all grades</a>
          <button class="unenroll-btn" data-id="${cls.classroom_id}">Unenroll</button>
        </div>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".view-grades-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `../../StudentAccessClassroom/student_access_classroom.html`;
    });
  });


  // Unenroll button handler
  document.querySelectorAll(".unenroll-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const classroomId = e.target.dataset.id;
      if (confirm(`Are you sure you want to unenroll from ${classroomId}?`)) {
        await unenrollClassroom(classroomId, user.email);
      }
    });
  });
})();

// Remove student from classroom
async function unenrollClassroom(classroomId, userEmail) {
  try {
    // Fetch current classroom data
    const { data: classroom, error: fetchError } = await supabase
      .from("classrooms")
      .select("students")
      .eq("classroom_id", classroomId)
      .single();

    if (fetchError) throw fetchError;

    const updatedStudents = (classroom.students || []).filter((s) => s !== userEmail);

    const { error: updateError } = await supabase
      .from("classrooms")
      .update({ students: updatedStudents })
      .eq("classroom_id", classroomId);

    if (updateError) throw updateError;

    alert("You have been unenrolled successfully!");
    location.reload();
  } catch (err) {
    console.error("Error unenrolling:", err);
    alert("Failed to unenroll from classroom.");
  }
}