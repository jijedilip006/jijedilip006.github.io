
document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
  
    if (!user || user.role !== "instructor") {
        // redirect to login if not logged in
        window.location.href = "../login.html";
      }
  
    // Fill in instructor profile
    document.getElementById("instructor-name").textContent =
      `${user.firstName} ${user.lastName}`;
    document.getElementById("instructor-email").textContent = user.email;
  
    try {
      // Get courses taught by this instructor
      const fullName = `${user.firstName} ${user.lastName}`;
      const { data: courses, error: courseError } = await supabase
        .from("courses")
        .select("id, title, owner,lesson_ids")
        .eq("owner", fullName);
  
      if (courseError) throw courseError;
  
      // Total courses
      document.getElementById("total-courses").textContent = courses?.length || 0;
  
      // Render course list
      const courseList = document.getElementById("course-list");
      courseList.innerHTML = "";
  
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = `Course ${i + 1}: ${course.title}`;
        details.appendChild(summary);
  
        // Fetch lessons for this course
      if (course.lesson_ids && course.lesson_ids.length > 0) {
        const { data: lessons, error: lessonError } = await supabase
          .from("lessons")
          .select("id, title")
          .in("id", course.lesson_ids);

        if (lessonError) {
          console.error("Error fetching lessons:", lessonError);
        } else {
          const ul = document.createElement("ul");
          lessons.forEach((lesson) => {
            const li = document.createElement("li");
            li.textContent = lesson.title || `Lesson ${lesson.id}`;
            ul.appendChild(li);
          });
          details.appendChild(ul);
        }
      }

      courseList.appendChild(details);
    }

    // Active classrooms count
    const { data: classrooms, error: classError } = await supabase
      .from("classrooms")
      .select("id")
      .eq("owner", user.email);

    if (classError) throw classError;

    document.getElementById("active-classrooms").textContent =
      classrooms?.length || 0;

  } catch (err) {
    console.error("Error loading profile:", err);
  }
});