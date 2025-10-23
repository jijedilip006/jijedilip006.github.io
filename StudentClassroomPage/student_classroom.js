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


// Get references to DOM elements
const classroomList = document.getElementById("classroom-list");
const messageDiv = document.getElementById("message");

// Run when page finishes loading
window.addEventListener("DOMContentLoaded", async () => {
  await loadClassrooms();
});

// Load classroom data from Supabase

async function loadClassrooms() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const selectedCourseId = localStorage.getItem("selectedCourseId");
  const selectedCourseTitle = localStorage.getItem("selectedCourseTitle");

  if (!user || user.role !== "student") {
    showMessage("Please log in as a student.", "error");
    return;
  }

  // Step 1: Check if student already in a classroom
  const { data: existing, error: existingError } = await supabase
    .from("classrooms")
    .select('classroom_id,"Draft Mode",Archived,students')
    .cs("students", [user.email]);

  if (existingError) {
    console.error("Error checking enrollment:", existingError);
    showMessage("Error verifying your classroom enrollment.", "error");
    return;
  }
  const activeEnrollment = (existing || []).some(
    (cls) => !cls["Draft Mode"] && !cls.Archived
  );

  if (activeEnrollment) {
    showMessage("You are already enrolled in a classroom. Please unenroll first.", "info");
    setTimeout(() => {
      window.location.href = "../Login page/student/student.html";
    }, 1500);
    return;
  }

  if (!selectedCourseId) {
    classroomList.innerHTML = `<tr><td colspan="6">No selected course found. Please enroll in a course first.</td></tr>`;
    return;
  }

  // Optional: Show which course is being viewed
  const form = document.getElementById("studentClassroomForm");
  const courseHeader = document.createElement("h3");
  courseHeader.textContent = `Classrooms for Course: ${selectedCourseTitle} (${selectedCourseId})`;
  form.insertBefore(courseHeader, form.querySelector("table"));

  // 1 Get all classrooms (we’ll filter safely)
  const { data: classrooms, error } = await supabase
  .from("classrooms")
  .select("*");

  if (error) {
  console.error("Error loading classrooms:", error);
  classroomList.innerHTML = `<tr><td colspan="6">Failed to load classrooms.</td></tr>`;
  return;
  }

  //  Filter classrooms that contain the selected course
  const validClassrooms = classrooms.filter((c) => {
    // Skip if classroom is Draft or Archived
    if (c["Draft Mode"] === true || c["Archived"] === true) return false;

    const list = c.course_list;
    if (Array.isArray(list)) return list.includes(selectedCourseId);
    if (typeof list === "string") {
      return list.split(",").map((x) => x.trim()).includes(selectedCourseId);
    }
    return false;
    });

  if (validClassrooms.length === 0) {
    classroomList.innerHTML = `<tr><td colspan="6">No classrooms found for this course.</td></tr>`;
    return;
  }

  //  Get all courses (to display titles + lessons)
  const { data: allCourses, error: courseError } = await supabase
    .from("courses")
    .select("id, title, lesson_ids");

  if (courseError) {
    console.error("Error loading courses:", courseError);
    showMessage("Failed to load course info.", "error");
    return;
  }

  // 4Render classroom table with course + lesson info
  classroomList.innerHTML = "";
  
  for (const classroom of validClassrooms) {
    const courseList = Array.isArray(classroom.course_list)
      ? classroom.course_list
      : typeof classroom.course_list === "string"
      ? classroom.course_list.split(",").map((s) => s.trim())
      : [];

    // Collect course titles & total lessons
    const courseTitles = [];
    let totalLessons = 0;

    for (const cid of courseList) {
      const course = allCourses.find(
        (c) => String(c.id).trim() === String(cid).trim()
      );
      if (course) {
        courseTitles.push(course.title || cid);
        if (Array.isArray(course.lesson_ids)) {
          totalLessons += course.lesson_ids.length;
        }
      } else {
        // fallback if course not found in courses table
        courseTitles.push(cid);
      }
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${classroom.classroom_id}</td>
      <td>${classroom.title}</td>
      <td>${classroom.owner || "Unknown"}</td>
      <td>${courseTitles.join(", ")}</td>
      <td>${totalLessons}</td>
      <td><button type="button" class="allocate-btn" data-id="${classroom.id}">Allocate</button></td>
    `;
    classroomList.appendChild(row);
  }


  // Add allocation event listeners
  document.querySelectorAll(".allocate-btn").forEach((btn) => {
    btn.addEventListener("click", () => allocateClassroom(btn.dataset.id));
  });
}

// Handle Allocate Button

async function allocateClassroom(classroomId) {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!user || user.role !== "student") {
      showMessage("Please log in as a student.", "error");
      return;
    }
  
    //  Get the current classroom data
    const { data: classroomData, error: fetchError } = await supabase
      .from("classrooms")
      .select("students")
      .eq("id", classroomId)
      .single();
  
    if (fetchError) {
      console.error("Error fetching classroom:", fetchError);
      showMessage("Failed to retrieve classroom info.", "error");
      return;
    }
  
    const currentStudents = Array.isArray(classroomData.students)
      ? classroomData.students
      : [];
  
    // Prevent duplicate enrollment
    const userIdentifier = user.email; // or user.id depending on what you store
    if (currentStudents.includes(userIdentifier)) {
      showMessage("You are already allocated to this classroom.", "info");
      return;
    }
  
    //  Append student to array
    const updatedStudents = [...currentStudents, userIdentifier];
  
    // Update classroom record in Supabase
    const { error: updateError } = await supabase
      .from("classrooms")
      .update({ students: updatedStudents })
      .eq("id", classroomId);
  
    if (updateError) {
      console.error("Allocation error:", updateError);
      showMessage("Failed to allocate classroom.", "error");
      return;
    }

  showMessage(`Successfully allocated to classroom!`, "success");
}

// Utility: Show temporary message

function showMessage(text, type = "info") {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;

  setTimeout(() => {
    window.location.href = "../Login page/student/student.html";
  }, 100);
}

