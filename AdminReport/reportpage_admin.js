// --- Connect to Supabase ---
const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// --- Helper function to update a <span> ---
function updateStat(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value ?? "0";
}

function getStatus(item) {
    if (item.Archived === true) return "archived";
    if (item["Draft Mode"] === true) return "draft";
    return "active";
}

// --- Main function ---
async function loadAdminReport() {
    try {
        // === Fetch Data ===
        const { data: courses, error: courseError } = await supabase.from("courses").select("*");
        const { data: classrooms, error: classError } = await supabase.from("classrooms").select("*");
        const { data: users, error: userError } = await supabase.from("users").select("*");
        const { data: lessons, error: lessonError } = await supabase.from("lessons").select("*");

        if (courseError || classError || userError || lessonError) {
            console.error("Error fetching data:", courseError || classError || userError || lessonError);
            return;
        }

        // === Courses Overview ===
        const totalCourses = courses.length;
        const activeCourses = courses.filter(c => getStatus(c) === "active").length;
        const archivedCourses = courses.filter(c => getStatus(c) === "archived").length;
        const draftCourses = courses.filter(c => c["Draft Mode"]=== true).length;

        const totalLessonRefs = courses.reduce((sum, c) => {
            if (Array.isArray(c.lesson_ids)) return sum + c.lesson_ids.length;
            return sum;
        }, 0);

        const averageLessonsPerCourse = totalCourses > 0
            ? (totalLessonRefs / totalCourses).toFixed(2)
            : 0;

        const averageCreditPerLesson = lessons.length > 0
            ? (lessons.reduce((sum, l) => sum + (l.creditPoints || 0), 0) / lessons.length).toFixed(2)
            : 0;

        const draftLessons = lessons.filter(l => l["Draft Mode"]).length;
        const archivedLessons = lessons.filter(l => l.Archived).length;
        const activeLessons = lessons.length - archivedLessons - draftLessons

        // === Classrooms Overview ===
        const totalClassrooms = classrooms.length;
        const activeClassrooms = classrooms.filter(c => getStatus(c) === "active").length;
        const draftedClassrooms = classrooms.filter(c => c["Draft Mode"]).length;
        const archivedClassrooms = classrooms.filter(c => c.Archived).length;

        const totalStudentsAcrossAllClassrooms = classrooms.reduce((sum, c) => {
            if (Array.isArray(c.students)) return sum + c.students.length;
            return sum;
        }, 0);

        const averageStudentsPerClassroom = totalClassrooms > 0
            ? (totalStudentsAcrossAllClassrooms / totalClassrooms).toFixed(1)
            : 0;

        // === User Statistics ===
        const totalUsers = users.length;
        const instructors = users.filter(u => u.role === "instructor").length;
        const students = users.filter(u => u.role === "student").length;

        // === Update the page ===
        const spans = document.querySelectorAll("p span");
        spans.forEach(span => (span.textContent = "Loading..."));

        updateStat(".report-section:nth-of-type(1) p:nth-of-type(1) span", totalCourses);
        updateStat(".report-section:nth-of-type(1) p:nth-of-type(2) span", activeCourses);
        updateStat(".report-section:nth-of-type(1) p:nth-of-type(3) span", archivedCourses);
        updateStat(".report-section:nth-of-type(1) p:nth-of-type(4) span", averageLessonsPerCourse);
        updateStat(".report-section:nth-of-type(1) p:nth-of-type(5) span", draftCourses);

        updateStat(".report-section:nth-of-type(2) p:nth-of-type(1) span", totalClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(2) span", activeClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(3) span", archivedClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(4) span", draftedClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(5) span", averageStudentsPerClassroom);

        updateStat(".report-section:nth-of-type(3) p:nth-of-type(1) span", totalUsers);
        updateStat(".report-section:nth-of-type(3) p:nth-of-type(2) span", instructors);
        updateStat(".report-section:nth-of-type(3) p:nth-of-type(3) span", students);

        updateStat(".report-section:nth-of-type(4) p:nth-of-type(1) span", lessons.length);
        updateStat(".report-section:nth-of-type(4) p:nth-of-type(2) span", averageCreditPerLesson);
        updateStat(".report-section:nth-of-type(4) p:nth-of-type(3) span", activeLessons);
        updateStat(".report-section:nth-of-type(4) p:nth-of-type(4) span", archivedLessons);
        updateStat(".report-section:nth-of-type(4) p:nth-of-type(5) span", draftLessons);
        

    } catch (err) {
        console.error("Error loading report:", err);
    }
}

// --- Run when page loads ---
document.addEventListener("DOMContentLoaded", loadAdminReport);
