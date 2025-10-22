import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = "https://mavdxyhwlfyzyarukwbr.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdmR4eWh3bGZ5enlhcnVrd2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjc3MjYsImV4cCI6MjA3Mzc0MzcyNn0.ZCvZ8IYV6QzXZN5dNC7NxZIXZl0YBI2ThjBLisfebYQ"   

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userData = {
            title: document.getElementById("title").value,
            firstName: document.getElementById("firstName").value.trim(),
            lastName: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value,
            role: document.querySelector("input[name='role']:checked")?.value,
        };

        const { data, error } = await supabase.from("users").insert([userData]);

        console.log("Supabase insert response:", { data, error });

        if (error) {
            alert("❌ Registration failed: " + error.message);
            return;
        }

        // Only redirect if no error
        window.location.href = "../Login page/login.html";
    })
})