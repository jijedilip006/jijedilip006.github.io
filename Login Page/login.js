const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ" ;

//  Use the global supabase object
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("Email");
    const passwordInput = document.getElementById("Password");

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
    // Query Supabase for the user with the given email
      const { data: user, error } = await supabase
        .from('users')        // Your table name
        .select('*')
        .eq('email', email)
        .limit(1)
        .single();

      if (error) throw error;

      if (!user) {
        alert("Email not found!");
        emailInput.value = "";
        passwordInput.value = "";
        emailInput.focus();
        return;
      }

      // Check password
      if (user.password !== password) {
        alert("Incorrect password!");
        passwordInput.value = "";
        passwordInput.focus();
        return;
      }

      // Save logged-in user and redirect
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      if (user.role === "student") window.location.href = "Login Page/student/student.html";
      else if (user.role === "instructor") window.location.href = "Login Page/instructor/instructor.html";
      else if (user.role === "admin") window.location.href = "Login Page/admin/admin.html";

    } catch (error) {
      console.error(error);
      alert("Login failed. Please try again.");
    }

});

'Login Page/student/student_profile.html'