const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


const user = JSON.parse(localStorage.getItem("loggedInUser"));
if (!user || user.role !== "student") {
  window.location.href = "../login.html";
}



const listEl = document.getElementById("course-list");

async function loadCourses() {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, owner, lesson_ids, Students_Enrolled, description,Instructor,title")
    .eq("Draft Mode", false);

  if (error) {
    console.error(error);
    listEl.innerHTML = "<p>Failed to load courses.</p>";
    return;
  }

  if (!courses || courses.length === 0) {
    listEl.innerHTML = "<p>No courses available.</p>";
    return;
  }

  

  const coursePromises = courses.map(async (course) => {
    const enrolled = Array.isArray(course.Students_Enrolled) && course.Students_Enrolled.includes(user.email);
    if (!enrolled) {
      let totalCredits = 0;

      if (course.lesson_ids && course.lesson_ids.length > 0) {
        const { data: lessons, error: lessonError } = await supabase
          .from("lessons")
          .select("creditPoints")
          .in("id", course.lesson_ids);

      if (lessonError) {
        console.error(`Error fetching lessons for course ${course.id}:`, lessonError);
      } else if(lessons){
        totalCredits = lessons.reduce((sum, lesson) => sum + (lesson.creditPoints || 0), 0);
      }
    }

    return {...course, totalCredits };
    }
    return null;
  });


  const coursewithCredits = await Promise.all(coursePromises);

  const finalcourseData = coursewithCredits.filter(c => c !== null);

  listEl.innerHTML = "";

  finalcourseData.forEach(course => {
    const enrolled = Array.isArray(course.Students_Enrolled) &&
                     course.Students_Enrolled.includes(user.id);
    if (!enrolled) {
      const div = document.createElement("div");
      div.className = "course-card";
      div.innerHTML = `
        <h2>${course.id}</h2>
        <p><strong>Title:</strong> ${course.title}</p>
        <p><strong>Owner:</strong> ${course.owner}</p>
        <p><strong>Total Credit Points:</strong> ${course.totalCredits || 0}</p>
        <button class="enroll-btn">Enroll</button>
      `;

      div.querySelector(".enroll-btn").addEventListener("click", () => enroll(course));
      listEl.appendChild(div);
      }
  });
}

async function enroll(course) {

  const userName = String(user.email);

  const currentStudents = (Array.isArray(course.Students_Enrolled)
      ? course.Students_Enrolled
      : []
    )

  const updatedStudents = currentStudents.concat(userName)
  
  const { error } = await supabase
    .from("courses")
    .update({ Students_Enrolled: updatedStudents })
    .eq("id", course.id);

  if (error) {
    console.error(error);
    alert("Enrollment failed.");
  } else {
    alert(`You are now enrolled in ${course.id}`);
    window.location.href = '../student.html';
  } 
}

loadCourses();