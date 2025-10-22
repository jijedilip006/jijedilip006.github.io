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

document.addEventListener("DOMContentLoaded", async () => {
    const lessonId = localStorage.getItem("viewLessonId");
  
    if (!lessonId) {
      alert("No lesson selected!");
      window.location.href = "../InstructorLessonsPage/lesson_page.html";
      return;
    }
  
    try {
      // Fetch lesson details
      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();
  
      if (error) throw error;
  
      // Fill lesson info
      document.getElementById("lesson-title").textContent = lesson.title || "Untitled Lesson";
      document.getElementById("lesson-id").textContent = lesson.id;
      document.getElementById("lesson-description").textContent = lesson.description || "No description provided.";
      document.getElementById("lesson-objective").textContent = lesson.objectives || "N/A";
      document.getElementById("lesson-hours").textContent = lesson.hours|| "N/A";
      document.getElementById("lesson-cp").textContent = lesson.creditPoints || "0";
      document.getElementById("lesson-prerequisites").textContent = lesson.prerequisites || "None";
      document.getElementById("lesson-owner").textContent = lesson.owner || "N/A";
      document.getElementById("lesson-reading-list").textContent = lesson.readingList?.join(", ") || "None";
      document.getElementById("lesson-assignments").textContent = lesson.assignments?.join(", ") || "None";
  
    } catch (err) {
      console.error("Error loading lesson details:", err);
      alert("Failed to load lesson details.");
    }
  });
    // --- Role & Context-Based Back Button ---
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const cameFrom = localStorage.getItem("cameFrom");
  const previousPage = localStorage.getItem("previousPage");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Adjust button label
  if (cameFrom === "course") {
    backBtn.textContent = "Back to Course";
  } else if (cameFrom === "classroom") {
    backBtn.textContent = "Back to Classroom";
  } else {
    backBtn.textContent = "Back";
  }

  backBtn.addEventListener("click", () => {
    // If we saved the actual previous URL → go there
    if (previousPage) {
      window.location.href = previousPage;
      localStorage.removeItem("previousPage");
      return;
    }

    // Go based on context
    if (cameFrom === "classroom") {
      window.location.href = "../ClassroomDetails/classroom_detail.html";
    } else if (cameFrom === "course") {
      window.location.href = "../CourseDetails/course_detail.html";
    } else if (user) {
      // Role-based fallback
      if (user.role === "admin") {
        window.location.href = "../AdminLessonsPage/lesson_page.html";
      } else if (user.role === "instructor") {
        window.location.href = "../InstructorLessonsPage/lesson_page.html";
      } else {
        window.history.back();
      }
    } else {
      window.history.back();
    }

    // cleanup
    localStorage.removeItem("cameFrom");
  });
});