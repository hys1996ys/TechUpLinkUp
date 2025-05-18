document.addEventListener('DOMContentLoaded', () => {
  
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Start  of For Sign Up
  const signUpBtn = document.getElementById('openSignup');
  const modal = document.getElementById('signupModal');
  const closeBtn = document.querySelector('.close');

  signUpBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Sign-up successful! Please check your email to confirm.');
      modal.classList.add('hidden');
    }
  });
// End of For Sign Up


// For Sign In

const signinBtn = document.getElementById('openSignin');
const signinModal = document.getElementById('signinModal');
const signinClose = document.querySelector('.close-signin');

signinBtn.addEventListener('click', () => {
  signinModal.classList.remove('hidden');
});

signinClose.addEventListener('click', () => {
  signinModal.classList.add('hidden');
});

document.getElementById('signinForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert('Sign-in failed: ' + error.message);
  } else {
    alert('Welcome back!');
    signinModal.classList.add('hidden');
    // Optional: redirect or show user dashboard
  }
});
// End of Sign In


});
