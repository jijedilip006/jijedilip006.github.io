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
    // Handle back button
    const backBtn = document.getElementById("backBtn");
    const cameFrom = localStorage.getItem("cameFrom");
    // Change the label based on where user came from
    if (cameFrom === "course") {
        backBtn.textContent = "Back to Course";
    } else if (cameFrom === "classroom") {
        backBtn.textContent = "Back to Classroom";
    } else {
        backBtn.textContent = "Back to Lessons";
    }

    backBtn.addEventListener("click", () => {
        
        if (cameFrom === "course") {
            const prevPage = localStorage.getItem("previousPage");
            if (prevPage) {
                window.location.href = prevPage; // go back to the exact page (could be classroom or course)
            } 
            localStorage.removeItem("cameFrom");
            localStorage.removeItem("previousPage");
        } else if (cameFrom === "classroom") {
            const classroomId = localStorage.getItem("viewClassroomId");
            if (classroomId) {
                window.location.href = "../ClassroomDetails/classroom_detail.html";
            } else {
                window.location.href = "../InstructorClassroomPage/classroomPage.html";
            }
            localStorage.removeItem("cameFrom");
        } else {
            window.location.href = "../InstructorLessonsPage/lesson_page.html";
        }
    });
});


  