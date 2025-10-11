// --- Connect to Supabase ---
const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

        // === Classrooms Overview ===
        const totalClassrooms = classrooms.length;
        const activeClassrooms = classrooms.filter(c => getStatus(c) === "active").length;
        const completedClassrooms = classrooms.filter(c => getStatus(c) === "archived").length;

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
        updateStat(".report-section:nth-of-type(1) p:nth-of-type(5) span", averageCreditPerLesson);

        updateStat(".report-section:nth-of-type(2) p:nth-of-type(1) span", totalClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(2) span", activeClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(3) span", completedClassrooms);
        updateStat(".report-section:nth-of-type(2) p:nth-of-type(4) span", averageStudentsPerClassroom);

        updateStat(".report-section:nth-of-type(3) p:nth-of-type(1) span", totalUsers);
        updateStat(".report-section:nth-of-type(3) p:nth-of-type(2) span", instructors);
        updateStat(".report-section:nth-of-type(3) p:nth-of-type(3) span", students);

    } catch (err) {
        console.error("Error loading report:", err);
    }
}

// --- Run when page loads ---
document.addEventListener("DOMContentLoaded", loadAdminReport);
