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
  
    // Only admins can access this page
    if (!user || user.role !== "admin") {
      window.location.href = "/index.html";
      return;
    }
  
    // Fill in admin profile info
    const profileInfo = document.querySelector(".profile-info");
    profileInfo.innerHTML = `
      <p><strong>First Name:</strong> ${user.firstName}</p>
      <p><strong>Last Name:</strong> ${user.lastName}</p>
      <p><strong>Email Address:</strong> ${user.email}</p>
    `;
  
    try {
      // Fetch all users from the users table
      const { data: users, error } = await supabase
        .from("users")
        .select("title, firstName, lastName, email, role");
  
      if (error) throw error;

      const filtered = users.filter(u => u.email !== user.email);

      const instructors = filtered.filter(u => u.role === "instructor");
      const students = filtered.filter(u => u.role === "student");

      populateTable("#instructorsTable tbody", instructors);
      populateTable("#studentsTable tbody", students);

    } catch (err) {
      console.error("Error loading admin profile:", err);
    }

    document.querySelector(".back-btn").addEventListener("click", () => {
      window.history.back();
    });
  });

  function populateTable(selector, users) {
    const tbody = document.querySelector(selector);
    tbody.innerHTML = "";

    users.forEach(u => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${u.title || "-"}</td>
        <td>${u.firstName || "-"}</td>
        <td>${u.lastName || "-"}</td>
        <td>${u.email || "-"}</td>
        <td><button class="remove-btn" data-email="${u.email}" data-role="${u.role}">Remove</button></td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const email = e.target.dataset.email;
        const role = e.target.dataset.role;
        removeUser(e, email, role);
      });
    });
  }


async function removeUser(e, email, role) {
  if (!confirm(`Are you sure you want to remove ${role} ${email}?`)) return;

  try {
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("email", email);
    if (userError) throw userError;

    const { error: gradesError } = await supabase
      .from("grades")
      .delete()
      .eq("student_email", email);
    if (gradesError) throw gradesError;

    if (role === "student") {
      // Remove from classrooms.students array
      const { data: classrooms, error: classroomFetchError } = await supabase
        .from("classrooms")
        .select("id, students");
      if (classroomFetchError) throw classroomFetchError;

      for (const classroom of classrooms) {
        const currentStudents = Array.isArray(classroom.students)
          ? classroom.students
          : JSON.parse(classroom.students || "[]");

        if (currentStudents.includes(email)) {
          const updatedStudents = currentStudents.filter((s) => s !== email);
          const { error: classroomUpdateError } = await supabase
            .from("classrooms")
            .update({ students: updatedStudents })
            .eq("id", classroom.id);
          if (classroomUpdateError) throw classroomUpdateError;
        }
      }

      // Remove from courses.students array
      const { data: courses, error: courseFetchError } = await supabase
        .from("courses")
        .select("id, Students_Enrolled");
      if (courseFetchError) throw courseFetchError;

      for (const course of courses) {
        const currentStudents = Array.isArray(course.Students_Enrolled)
          ? course.Students_Enrolled
          : JSON.parse(course.Students_Enrolled || "[]");

        if (currentStudents.includes(email)) {
          const updatedStudents = currentStudents.filter((s) => s !== email);
          const { error: courseUpdateError } = await supabase
            .from("courses")
            .update({ Students_Enrolled: updatedStudents })
            .eq("id", course.id);
          if (courseUpdateError) throw courseUpdateError;
        }
      }
    }

    alert(`${role.charAt(0).toUpperCase() + role.slice(1)} ${email} removed successfully.`);
    e.target.closest("tr").remove();
  } catch (error) {
    console.error("❌ Failed to remove user or clean up related data:", error);
    alert("Failed to remove user or clean up related data. Check console for details.");
  }
}
