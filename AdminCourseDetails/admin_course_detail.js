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
  const courseId = localStorage.getItem("viewCourseId");

  if (!courseId) {
    alert("No course selected!");
    window.location.href = "../AdminCoursesPage/admin_course_page.html";
    return;
  }

  try {
    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError) throw courseError;

    // Fill course info
    document.getElementById("course-title").textContent = course.title;
    document.getElementById("course-id").textContent = course.id;
    document.getElementById("course-description").textContent = course.description || "No description provided.";

    // Prepare lesson IDs
    let lessonIds = course.lesson_ids;
    if (typeof lessonIds === "string") {
      lessonIds = JSON.parse(lessonIds);
    }

    const lessonsList = document.getElementById("lessons-list");
    lessonsList.innerHTML = "";

    if (!lessonIds || lessonIds.length === 0) {
      lessonsList.innerHTML = "<p>No lessons yet.</p>";
    } else {
      // Fetch lessons using the IDs
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, title, description, creditPoints")
        .in("id", lessonIds);

      if (lessonsError) throw lessonsError;

      // Create bullet list
      const ul = document.createElement("ul");
      let totalCredits = 0;

      lessons.forEach(lesson => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#";  // placeholder
        link.textContent = lesson.id + (lesson.title ? ` - ${lesson.title}` : "");
        
        // Make the entire link clickable and fill the li
        link.style.display = "block";
        link.style.textDecoration = "none"; 
        link.classList.add("lesson-link"); // adjust to your theme
        link.style.padding = "5px 0";
        
        link.addEventListener("mouseover", () => {
          link.style.textDecoration = "underline";
          link.style.cursor = "pointer";
        });
        link.addEventListener("mouseout", () => {
          link.style.textDecoration = "none";
        });
        
        link.addEventListener("click", () => {
          localStorage.setItem("viewLessonId", lesson.id);
          localStorage.setItem("cameFrom", "course"); 
          localStorage.setItem("previousPage", "../AdminCourseDetails/admin_course_detail.html");
          window.location.href = "../AdminLessonDetails/admin_lesson_detail.html";
        });

        li.appendChild(link);
        ul.appendChild(li);
        totalCredits += lesson.creditPoints || 0;
      });


      lessonsList.appendChild(ul);

      // Display total credit points
      document.getElementById("total-credits").textContent = totalCredits;
    }

  } catch (err) {
    console.error("Error loading course details:", err);
    alert("Failed to load course details.");
  }
});
