// report_page.js
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
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
  
    if (!user || user.role !== "instructor") {
      window.location.href = "/index.html";
      return;
    }
  
    const fullName = `${user.firstName} ${user.lastName}`;
  
    try {
      // Fetch courses owned by this instructor
      const { data: courses, error: courseError } = await supabase
        .from("courses")
        .select('id, title,lesson_ids, "Draft Mode", Archived')
        .eq("owner", fullName);
  
      if (courseError) throw courseError;
  
      const totalCourses = courses.length;
      const draftCourses = courses.filter(c => c["Draft Mode"]=== true).length;
      const archivedCourses = courses.filter(c => c.Archived === true).length;
      const activeCourses = totalCourses - draftCourses - archivedCourses;
  
      // Calculate total lessons and average credit per lesson (if lesson_ids contain credit)
      let totalLessons = 0;
      let totalCredits = 0;
  
      const allLessonIds = courses.flatMap(c => c.lesson_ids || []);
      if (allLessonIds.length > 0) {
        const { data: lessons, error: lessonError } = await supabase
          .from("lessons")
          .select('id, creditPoints, "Draft Mode", Archived')
          .in("id", allLessonIds);
        
        if (lessonError) throw lessonError;
    
        totalLessons = lessons.length;
        const draftLessons = lessons.filter(l => l["Draft Mode"]).length;
        const archivedLessons = lessons.filter(l => l.Archived).length;
        const activeLessons = totalLessons - draftLessons - archivedLessons;
        totalCredits = lessons.reduce((sum, l) => sum + (l.creditPoints || 0), 0);
    
        const avgLessons = totalCourses > 0 ? (totalLessons / totalCourses).toFixed(2) : 0;
        const avgCredit = totalLessons > 0 ? (totalCredits / totalLessons).toFixed(2) : 0;
    
        // Update Lesson section
        document.getElementById("num-lessons").textContent = totalLessons;
        document.getElementById("active-lessons").textContent = activeLessons;
        document.getElementById("archived-lessons").textContent = archivedLessons;
        document.getElementById("draft-lessons").textContent = draftLessons;
        document.getElementById("avg-credit").textContent = avgCredit;

        // Update Course section
        document.getElementById("num-courses").textContent = totalCourses;
        document.getElementById("active-courses").textContent = activeCourses;
        document.getElementById("archived-courses").textContent = archivedCourses;
        document.getElementById("draft-courses").textContent = draftCourses;
        document.getElementById("avg-courses").textContent = avgLessons;
      }

        // ====== FETCH CLASSROOMS ======
      const { data: classrooms, error: classError } = await supabase
      .from("classrooms")
      .select('classroom_id, students, "Draft Mode", Archived')
      .eq("owner", user.email);

      if (classError) throw classError;

      const totalClassrooms = classrooms.length;
      const draftClassrooms = classrooms.filter(c => c["Draft Mode"]).length;
      const archivedClassrooms = classrooms.filter(c => c.Archived).length;
      const activeClassrooms =
        totalClassrooms - draftClassrooms - archivedClassrooms;

      let totalStudents = 0;
      classrooms.forEach(c => {
        if (Array.isArray(c.students)) totalStudents += c.students.length;
      });

      const avgStudents =
      totalClassrooms > 0
      ? Math.round(totalStudents / totalClassrooms)
      : 0;

      // Update Classroom section
      document.getElementById("num-classrooms").textContent = totalClassrooms;
      document.getElementById("active-classrooms").textContent = activeClassrooms;
      document.getElementById("archived-classrooms").textContent =
        archivedClassrooms;
      document.getElementById("draft-classrooms").textContent = draftClassrooms;
      document.getElementById("avg-students").textContent = avgStudents;
    } catch (err) {
      console.error("Error loading report:", err);
    }
    });
      