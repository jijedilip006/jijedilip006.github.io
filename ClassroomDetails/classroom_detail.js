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
    
    let lessonIds = classroom.lessons;
    if (typeof lessonIds === "string") {
      try { lessonIds = JSON.parse(lessonIds); } catch { lessonIds = []; }
    }

    const lessonsList = document.getElementById("lessons-list");
    lessonsList.innerHTML = "";

    if (!lessonIds || lessonIds.length === 0) {
      lessonsList.innerHTML = "<p>No lessons yet.</p>";
    } else {
      // Fetch lessons using the IDs
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .in("id", lessonIds);

      if (lessonsError) throw lessonsError;

      // Create bullet list
      const ul = document.createElement("ul");
      lessons.forEach(lesson => {
        const li = document.createElement("li");
        li.textContent = `${lesson.id} - ${lesson.description || ""}`;
        li.style.cursor = "pointer";
        li.classList.add("lesson-item");

        li.addEventListener("click", () => {
          localStorage.setItem("viewLessonId", lesson.id); 
          localStorage.setItem("cameFrom", "classroom");
          window.location.href = "../LessonDetails/lesson_detail.html"; 
        });

        ul.appendChild(li);
      });

      lessonsList.appendChild(ul);
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
          const { error } = await supabase
            .from("grades")
            .upsert([
              {
                classroom_id: classroomId,
                student_email: email,
                grade: grade
              }
            ]);

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