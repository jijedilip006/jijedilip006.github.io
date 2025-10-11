const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const courseTitleEl = document.getElementById("course-title");
const lessonsContainer = document.getElementById("lessons-container");

// Get courseId 
const params = new URLSearchParams(window.location.search);
const courseId = params.get("courseId");

if (!courseId) {
  courseTitleEl.textContent = "No course selected";
  lessonsContainer.textContent = "Missing courseId in URL.";
} else {
  loadLessons();


}

async function loadLessons() {
  //  get lesson_ids
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, lesson_ids")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    courseTitleEl.textContent = "Error loading course";
    lessonsContainer.textContent =
      courseError?.message || "No course found.";
    return;
  }

  courseTitleEl.textContent = `Lessons for Course: ${course.id}`;

  // lesson rows
  const lessonIds = course.lesson_ids || [];
  if (lessonIds.length === 0) {
    lessonsContainer.textContent = "No lessons found for this course.";
    return;
  }

  const { data: lessons, error: lessonsError } = await supabase
  .from("lessons")
  .select("id, title, description, completed_by, prerequisites")  
  .in("id", lessonIds);

  if (lessonsError) {
    lessonsContainer.textContent = "Error loading lessons.";
    console.error(lessonsError);
    return;
  }

const user = JSON.parse(localStorage.getItem("loggedInUser"));
const studentEmail = user?.email;
const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");

lessons.forEach((lesson) => {
  const completedList = Array.isArray(lesson.completed_by) ? lesson.completed_by : [];
  const isDone = studentEmail && completedList.map(norm).includes(norm(studentEmail));


const prereqs = Array.isArray(lesson.prerequisites) ? lesson.prerequisites : [];
const canAccess = prereqs.every(preId => {
  const preLesson = lessons.find(l => l.id === preId);
  if (!preLesson) return false; 
  const preCompleted = Array.isArray(preLesson.completed_by) ? preLesson.completed_by : [];
  return studentEmail && preCompleted.map(norm).includes(norm(studentEmail));
});

lessonsContainer.innerHTML += `
  <div class="lesson-card" data-lesson-id="${lesson.id}">
    <a href="${canAccess ? `individual_lessons.html?lessonId=${lesson.id}` : '#'}"
       class="lesson-link ${canAccess ? '' : 'locked'}"
       style="flex:1; text-decoration:none; color:inherit; display:flex; align-items:center; justify-content:space-between;">
      <div>
        <h3>${lesson.title}</h3>
        <p>${lesson.description || "No description"}</p>
      </div>
      ${!canAccess ? `<span class="lock-icon">🔒</span>` : ''}
    </a>
    <div class="done-box">
<input type="checkbox" id="done-${lesson.id}" 
       ${isDone ? "checked" : ""} 
       ${canAccess ? "" : "disabled"}>      <label for="done-${lesson.id}">${isDone ? "Done" : "Mark as done"}</label>
    </div>
  </div>
`;
});


lessonsContainer.addEventListener("change", async (e) => {
  if (!e.target.matches('input[type="checkbox"]')) return;

  const checkbox = e.target;
  const lessonCard = checkbox.closest(".lesson-card");
  const lessonId = lessonCard.dataset.lessonId;
  const label = checkbox.nextElementSibling;
  const checked = checkbox.checked;

  
  checkbox.disabled = true;

  try {
    const { data: lessonRow, error } = await supabase
      .from("lessons")
      .select("completed_by")
      .eq("id", lessonId)
      .single();

    if (error) throw error;

    const current = Array.isArray(lessonRow.completed_by) ? lessonRow.completed_by : [];
    let updated;
    if (checked) {
      updated = current.includes(studentEmail) ? current : [...current, studentEmail];
    } else {
      updated = current.filter((e) => e !== studentEmail);
    }

    const { error: updateErr } = await supabase
      .from("lessons")
      .update({ completed_by: updated })
      .eq("id", lessonId);

    if (updateErr) throw updateErr;

    label.textContent = checked ? "Done" : "Mark as done";
    window.location.reload();

  } catch (err) {
    console.error("Error updating completed_by:", err);
    checkbox.checked = !checked;
    alert("Could not update completion. Check console.");
  } finally {
    checkbox.disabled = false;
  }
});
}