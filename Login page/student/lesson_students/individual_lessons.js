

    const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const params = new URLSearchParams(window.location.search);
    const lessonId = params.get("lessonId");

    const titleEl = document.getElementById("lesson-title");
    const contentEl = document.getElementById("lesson-content");

    if (!lessonId) {
      titleEl.textContent = "Lesson not found";
      contentEl.textContent = "Missing lessonId in URL.";
    } else {
      loadLesson();
    }

    async function loadLesson() {
      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();

      if (error || !lesson) {
        titleEl.textContent = "Error loading lesson";
        contentEl.textContent = error?.message || "Lesson not found.";
        return;
      }

      titleEl.textContent = lesson.title;
      contentEl.innerHTML = `
        <div class="lesson-basic-info">
          <p><strong>ID:</strong> ${lesson.id}</p>
          <p><strong>Prerequisites:</strong> ${
            Array.isArray(lesson.prerequisites) && lesson.prerequisites.length
              ? lesson.prerequisites.join(", ")
              : "None"
          }</p>
          <p><strong>Owner:</strong> ${lesson.owner || "Not specified"}</p>
          <p><strong>Credit Points:</strong> ${lesson.creditPoints || "N/A"}</p>
          <p><strong>Description:</strong> ${lesson.description || "No description available."}</p>

          <div class="lesson-main-details">
            <p><strong>Assignments</strong></p>
            ${
              Array.isArray(lesson.assignments) && lesson.assignments.length
                ? `<ul>${lesson.assignments.map(a => `<li>${a}</li>`).join("")}</ul>`
                : "No assignments."
            }

            <p><strong>Reading List</strong></p>
            ${
              Array.isArray(lesson.readingList) && lesson.readingList.length
                ? `<ul>${lesson.readingList.map(r => `<li>${r}</li>`).join("")}</ul>`
                : "No reading list."
            }
          </div>
        </div>
      `;
    }
