const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ" ;

//  Use the global supabase object
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const studentsContainer = document.getElementById("students-container");
const teacherSelect = document.getElementById("teacher");

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

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const editId = getQueryParam("id");

async function loadStudents() {
  const { data: students, error } = await supabase
    .from("users")
    .select("firstName, lastName, email")
    .eq("role", "student");

  if (error) {
    console.error("Error fetching students:", error);
    return;
  }

  studentsContainer.innerHTML = "";
  students.forEach(s => {
    const fullName = `${s.firstName} ${s.lastName}`;
    const div = document.createElement("div");
    div.classList.add("student-box");
    div.innerHTML = `
      <input type="checkbox" id="student-${s.email}" value="${s.email}">
      <label for="student-${s.email}">${fullName} (${s.email})</label>
    `;
    studentsContainer.appendChild(div);
  });
}

async function loadCourses() {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title");

  if (error) {
    console.error("Error fetching courses:", error);
    return;
  }

  const select = document.getElementById("courseSelect");
  select.innerHTML = '<option value="" disabled selected>-- Choose a course --</option>';

  courses.forEach(course => {
    const opt = document.createElement("option");
    opt.value = course.id;
    opt.textContent = course.title;
    select.appendChild(opt);
  });
}

async function loadTeachers() {
  const { data: teachers, error } = await supabase
    .from("users")
    .select("firstName, lastName, email")
    .eq("role", "instructor");

  if (error) {
    console.error("Error fetching teachers:", error);
    return;
  }

  const teacherSelect = document.getElementById("owner");

  // Always reset with a disabled placeholder
  teacherSelect.innerHTML = '<option value="" disabled selected>-- Choose owner of classroom --</option>';

  // Add instructors as options
  teachers.forEach(t => {
    const fullName = `${t.firstName} ${t.lastName}`;
    const opt = document.createElement("option");
    opt.value = t.email;
    opt.textContent = fullName;
    teacherSelect.appendChild(opt);
  });
}

// -------------------------
// Load classroom if editing
// -------------------------
async function loadClassroomForEdit(id) {
  const { data, error } = await supabase.from("classrooms").select("*").eq("id", id).single();
  if (error) return console.error("Error fetching classroom:", error);

  document.getElementById("classroomID").value = data.classroom_id;
  document.getElementById("classroomTitle").value = data.title || "";
  document.getElementById("startDate").value = data.start_date;
  document.getElementById("duration").value = data.duration;
  document.getElementById("owner").value = data.owner;
  document.getElementById("courseSelect").value = data.course_list;

  if (Array.isArray(data.students)) {
    data.students.forEach(email => {
      const cb = document.getElementById(`student-${email}`);
      if (cb) cb.checked = true;
    });
  }

  document.querySelector("#classroomForm button[type=submit]").textContent = "Update Classroom";
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadStudents(), loadTeachers(), loadCourses()]);

  if (editId) {
    await loadClassroomForEdit(editId);
  }
});

async function handleSave(isDraft) {
  const classroomID = document.getElementById("classroomID").value.trim();
  const classroomTitle = document.getElementById("classroomTitle").value.trim();
  const course_list = document.getElementById("courseSelect").value;
  const startDate = document.getElementById("startDate").value;
  const duration = parseInt(document.getElementById("duration").value);
  const students = Array.from(
    document.querySelectorAll("#students-container input[type=checkbox]:checked")
  ).map(cb => cb.value);
  const owner = document.getElementById("owner").value;

  if (!classroomID || !classroomTitle || !course_list || !startDate || !duration || !owner) {
    alert("Please fill in all required fields.");
    return;
  }

  if (!editId) {
    const { data: existing } = await supabase
      .from("classrooms")
      .select("id")
      .eq("classroom_id", classroomID);

    if (existing && existing.length > 0) {
      alert("A classroom with this ID already exists. Please choose a different Classroom ID.");
      return;
    }
  }

  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select("Students_Enrolled")
    .eq("id", course_list)
    .single();

  if (courseError) {
    console.error("Error fetching course data:", courseError);
    alert("Error checking course enrollment.");
    return;
  }

  const enrolledStudents = Array.isArray(courseData.Students_Enrolled)
    ? courseData.Students_Enrolled
    : JSON.parse(courseData.Students_Enrolled || "[]");

  const notEnrolled = students.filter(s => !enrolledStudents.includes(s));

  if (notEnrolled.length > 0) {
    console.error("These students are not enrolled in the selected course:", notEnrolled);
    alert(`Error: Some selected students are not enrolled in the chosen course.\n\n${notEnrolled.join(", ")}`);
    return;
  }

  const { data: allClassrooms, error: classError } = await supabase
    .from("classrooms")
    .select("id, students");

  if (classError) {
    console.error("Error fetching classrooms:", classError);
    alert("Error verifying student assignments.");
    return;
  }

  // Flatten classroom student lists (ignore current one if editing)
  const existingAssignments = new Map();
  allClassrooms.forEach(c => {
    if (editId && c.id === parseInt(editId)) return; // skip current edit classroom
    if (Array.isArray(c.students)) {
      c.students.forEach(stu => existingAssignments.set(stu, true));
    }
  });

  const alreadyAssigned = students.filter(s => existingAssignments.has(s));
  if (alreadyAssigned.length > 0) {
    alert(`Error: These students are already assigned to another classroom.\n\n${alreadyAssigned.join(", ")}`);
    return;
  }

  const classroomData = {
    classroom_id: classroomID,
    title: classroomTitle,
    course_list,
    owner,
    start_date: startDate,
    duration,
    students,
    "Draft Mode": isDraft
  };

  const query = editId
    ? supabase.from("classrooms").update(classroomData).eq("id", editId)
    : supabase.from("classrooms").insert([classroomData]);

  const { error } = await query;
  if (error) {
    alert("Error saving classroom: " + error.message);
    console.error(error);
  } else {
    alert(isDraft ? "Classroom saved as draft!" : "Classroom published successfully!");
    window.location.href = "../AdminClassroomPage/admin_classroom_page.html";
  }
}

// ----------------------
// Hook up Save + Publish
// ----------------------
document.querySelector(".save-link").addEventListener("click", (e) => {
  e.preventDefault();
  handleSave(true);   // Save = draft
});

document.querySelector("#classroomForm").addEventListener("submit", (e) => {
  e.preventDefault();
  handleSave(false);  // Publish = create/update
});