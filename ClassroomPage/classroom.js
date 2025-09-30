const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ" ;

//  Use the global supabase object
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const studentsContainer = document.getElementById("students-container");
const teacherSelect = document.getElementById("teacher");

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const editId = getQueryParam("id");
// -------------------------
// 2. Load Students from DB
// -------------------------
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

async function loadLessons() {
  const { data: lessons, error } = await supabase.from("lessons").select("*");
  if (error) {
    console.error("Error fetching lessons:", error);
    return;
  }

  const container = document.getElementById("lessonContainer");
  container.innerHTML = ""; // clear old

  lessons.forEach(lesson => {
    const box = document.createElement("div");
    box.classList.add("lesson-box");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `lesson-${lesson.id}`;
    checkbox.value = lesson.id; 

    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.textContent = lesson.title; 

    box.appendChild(checkbox);
    box.appendChild(label);
    container.appendChild(box);
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
async function loadClassroomForEdit(editId) {
  const submitBtn = document.querySelector("#classroomForm button[type=submit]");
  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .eq("id", editId)
    .single();

  if (error) {
    console.error("Error fetching classroom:", error);
    return;
  }

  // Prefill inputs
  document.getElementById("classroomID").value = data.classroom_id;
  document.getElementById("classroomTitle").value = data.title || "";
  document.getElementById("startDate").value = data.start_date;
  document.getElementById("duration").value = data.duration;
  document.getElementById("owner").value = data.owner;

  // Prefill lessons
  let lessonIds = [];

  // Handle both string and array cases
  if (Array.isArray(data.lessons)) {
    lessonIds = data.lessons;
  } else if (typeof data.lessons === "string") {
    try {
      lessonIds = JSON.parse(data.lessons);
    } catch (e) {
      console.error("Error parsing lessons string:", data.lessons, e);
    }
  }

  console.log("Prefilling lessons:", lessonIds);

  lessonIds.forEach(lessonId => {
    const cb = document.getElementById(`lesson-${lessonId}`);
    if (cb) {
      cb.checked = true;
    } else {
      console.warn("Checkbox not found for lesson:", lessonId);
    }
  });

  // Prefill students
  if (Array.isArray(data.students)) {
    data.students.forEach((studentEmail) => {
      const cb = document.getElementById(`student-${studentEmail}`);
      if (cb) cb.checked = true;
    });
  }

  // Prefill teacher
  if (data.owner) {
    teacherSelect.value = data.owner;
  }

  // Change button text
  submitBtn.textContent = "Update Classroom";
}

document.getElementById("classroomForm").addEventListener("submit", async (event) => {
    event.preventDefault()

    const classroomID = document.getElementById("classroomID").value;
    const classroomTitle = document.getElementById("classroomTitle").value;
    const lessons = Array.from(
      document.querySelectorAll("#lessonContainer input[type=checkbox]:checked")
    ).map(cb => cb.value);
    const startDate = document.getElementById("startDate").value;
    const duration = parseInt(document.getElementById("duration").value);
    const students = Array.from(
        document.querySelectorAll("#students-container input[type=checkbox]:checked")
    ).map(cb => cb.value);
    const owner = document.getElementById("owner").value;
    
    let result;
    if (editId) {
      // 🔹 UPDATE if editing
      result = await supabase
        .from("classrooms")
        .update({
          classroom_id: classroomID,
          title: classroomTitle,
          lessons,
          owner,
          start_date: startDate,
          duration,
          students
        })
        .eq("id", editId);  // match by primary key
    } else {
      result = await supabase
          .from("classrooms")
          .insert([
              {
                  classroom_id: classroomID,
                  title: classroomTitle, 
                  lessons: lessons,
                  owner: owner,
                  start_date: startDate,
                  duration: duration,
                  students: students,          // single student
              }
          ]);
      }
    const { data, error } = result;
    
    if (error) {
        alert("Error creating classroom: " + error.message);
        console.error(error);
    } else {
        alert(editId? "Classroom updates successfully!" : "Classroom created successfully!");
        console.log(data);
        // redirect to classroom list page
        window.location.href = "../InstructorClassroomPage/classroomPage.html";
    }
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Run in parallel
    await Promise.all([
      loadStudents(),
      loadTeachers(),
      loadLessons()
    ]);

    // Only after lessons/students/teachers are loaded,
    // fetch classroom if editing
    if (editId) {
      await loadClassroomForEdit(editId);
    } else {
      
      const user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (user && user.role === "instructor") {
        document.getElementById("owner").value = user.email;
      }
    }
  } catch (err) {
    console.error("Error during page load:", err);
  }
});