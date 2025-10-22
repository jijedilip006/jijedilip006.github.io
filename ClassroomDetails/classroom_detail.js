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
  const classroomId = localStorage.getItem("viewClassroomId");

  if (!classroomId) {
    alert("No classroom selected!");
    window.location.href = "../InstructorClassroomPage/classroomPage.html";
    return;
  }

  try {
    const { data: classroom, error: classroomError } = await supabase
      .from("classrooms")
      .select("*")
      .eq("classroom_id", classroomId)
      .single();

    if (classroomError) throw classroomError;

    document.getElementById("classroom-title").textContent = classroom.title || "Untitled Classroom";
    document.getElementById("classroom-id").textContent = classroom.classroom_id;
    document.getElementById("classroom-owner").textContent = classroom.owner;
    document.getElementById("classroom-start-date").textContent = classroom.start_date;

    
    document.getElementById("classroom-duration").textContent =
      `${classroom.duration} week${classroom.duration > 1 ? "s" : ""}`;

    let students = classroom.students;
    if (typeof students === "string") {
      try { students = JSON.parse(students); } catch { students = []; }
    }
    if (!Array.isArray(students)) students = [];

    const allUserIds = [classroom.owner, ...students];

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("email, firstName, lastName")
      .in("email", allUserIds);

    if (usersError) throw usersError;

    const userMap = {};
    users.forEach(u => {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
        userMap[u.email] = {
            name: fullName || u.email,
            display: fullName ? `${fullName} - ${u.email}` : u.email
        };
    });
    document.getElementById("classroom-id").textContent = classroom.classroom_id;
    document.getElementById("classroom-title").textContent = classroom.title || "Untitled Classroom";
    document.getElementById("classroom-owner").textContent =
        userMap[classroom.owner]?.name || classroom.owner;
    document.getElementById("classroom-start-date").textContent = classroom.start_date;
    document.getElementById("classroom-duration").textContent =
      `${classroom.duration} week${classroom.duration > 1 ? "s" : ""}`;

    const studentsEl = document.getElementById("classroom-students");
    studentsEl.innerHTML = "";
    if (students.length > 0) {
      const ul = document.createElement("ul");
      students.forEach(s => {
        const li = document.createElement("li");
        li.textContent = userMap[s]?.display || s;
        ul.appendChild(li);
      });
      studentsEl.appendChild(ul);
    } else {
      studentsEl.textContent = "No students yet.";
    }
    
    // --- Courses list instead of lessons ---
    let courseIds = classroom.course_list;
    if (typeof courseIds === "string") {
      courseIds = courseIds.split(",").map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(courseIds)) {
      courseIds = [];
    }

    const coursesList = document.getElementById("lessons-list");
    coursesList.innerHTML = "";

    if (courseIds.length === 0) {
      coursesList.innerHTML = "<p>No courses assigned to this classroom.</p>";
    } else {
      // Fetch course details
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, description")
        .in("id", courseIds);

      if (coursesError) throw coursesError;

      const ul = document.createElement("ul");
      courses.forEach(course => {
        const li = document.createElement("li");
        li.textContent = `${course.id} - ${course.title || "Untitled Course"}`;
        li.style.cursor = "pointer";
        li.classList.add("course-item");

        li.addEventListener("click", () => {
          localStorage.setItem("viewCourseId", course.id);
          localStorage.setItem("cameFrom", "classroom");
          window.location.href = "../CourseDetails/course_detail.html";
        });

        ul.appendChild(li);
      });

      coursesList.appendChild(ul);
    }

    const { data: existingGrades, error: gradesError } = await supabase
      .from("grades")
      .select("student_email, grade")
      .eq("classroom_id", classroomId);

    if (gradesError) throw gradesError;

    const gradeMap = {};
    existingGrades?.forEach(g => {
      gradeMap[g.student_email] = g.grade;
    });

    const tbody = document.querySelector("#grades-table tbody");
    tbody.innerHTML = "";

    students.forEach(email => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${userMap[email]?.name || email}</td>
        <td>${email}</td>
        <td>
          <select class="grade-select" data-email="${email}">
            <option value="">--Select--</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);

      // Pre-fill saved grade if exists
      const select = tr.querySelector(".grade-select");
      if (gradeMap[email]) {
        select.value = gradeMap[email];
      }
    });
    


    // --- Auto-save on grade change ---
    document.querySelectorAll(".grade-select").forEach(select => {
      select.addEventListener("change", async () => {
        const email = select.dataset.email;
        const grade = select.value;

        try {
          const { data: existing } = await supabase
            .from("grades")
            .select("id")
            .eq("classroom_id", classroomId)
            .eq("student_email", email)
            .single();

          let error;

          if (existing) {
            // update
            ({ error } = await supabase
              .from("grades")
              .update({ grade })
              .eq("id", existing.id));
          } else {
            // insert
            ({ error } = await supabase
              .from("grades")
              .insert([{ classroom_id: classroomId, student_email: email, grade }]));
          }

          if (error) throw error;
          console.log(`Grade saved for ${email}: ${grade}`);
        } catch (err) {
          console.error("Error saving grade:", err);
          alert(`Failed to save grade for ${email}`);
        }
      });
    });

  } catch (err) {
    console.error("Error loading course details:", err);
    alert("Failed to load course details.");
  }
});

  // --- Role-based Back Button ---
document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("back-button");
  if (backButton) {
    backButton.addEventListener("click", () => {
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!user) {
        window.history.back();
        return;
      }

      // Navigate based on role
      if (user.role === "instructor") {
        window.location.href = "../InstructorClassroomPage/classroomPage.html";
      } else if (user.role === "admin") {
        window.location.href = "../AdminClassroomPage/admin_classroom_page.html";
      } else if (user.role === "student") {
        window.location.href = "../StudentClassroomPage/classroomPage.html";
      } else {
        // fallback
        window.history.back();
      }
    });
  }
});
