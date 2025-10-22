const user = JSON.parse(localStorage.getItem("loggedInUser"));

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
      body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  });


  if (!user || user.role !== "student") {
    window.location.href = "../Login page/login.html";
    return;
  }

  loadStudentGrades();

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "../Login page/student/student.html";
    });
  }
});

async function loadStudentGrades() {
  const gradesContainer = document.getElementById("grades-list");

  try {

    const { data: grades, error } = await supabase
      .from("grades")
      .select("classroom_id, category, grade")
      .eq("student_email", user.email); 

    if (error) throw error;

    if (!grades || grades.length === 0) {
      gradesContainer.innerHTML = `<p>No grades available.</p>`;
      return;
    }

    gradesContainer.innerHTML = grades
      .map(
        (g) => `
        <div class="grade-box">
          <p><strong>Classroom:</strong> ${g.classroom_id}</p>
          <p><strong>Category:</strong> ${g.category}</p>
          <p><strong>Grade:</strong> ${g.grade}</p>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Error fetching grades:", err);
    gradesContainer.innerHTML = `<p>Error loading grades.</p>`;
  }
}
