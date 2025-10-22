// student_page.js

// 1. Get reference to table body
const tableBody = document.querySelector("#studentsTable tbody");

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

// 2. Fetch students from Supabase
async function fetchStudents() {
  try {
    const { data, error } = await supabase
      .from("users") // <-- use your actual table name
      .select("firstName, lastName, email, role")
      .eq("role", "student") // filter only students
      .order("firstName", { ascending: true });

    if (error) {
      console.error("Error fetching students:", error);
      tableBody.innerHTML = `<tr><td colspan="3">Error loading students</td></tr>`;
      return;
    }

    // 3. Handle case of no data
    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3">No students found</td></tr>`;
      return;
    }

    // 4. Render rows
    tableBody.innerHTML = ""; // clear old rows
    data.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.firstName || ""}</td>
        <td>${student.lastName || ""}</td>
        <td>${student.email || ""}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    tableBody.innerHTML = `<tr><td colspan="3">Unexpected error occurred</td></tr>`;
  }
}

// 5. Run fetch on load
fetchStudents();
