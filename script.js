const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  const signUpBtn = document.getElementById('openSignup');
  const signUpModal = document.getElementById('signupModal');
  const signUpClose = document.querySelector('.close');

  const signinBtn = document.getElementById('openSignin');
  const signinModal = document.getElementById('signinModal');
  const signinClose = document.querySelector('.close-signin');

  const logoutBtn = document.getElementById('logoutBtn');

  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const nameInput = document.getElementById('name');
  const designationInput = document.getElementById('designation');
  const descriptionInput = document.getElementById('description');
  const avatar = document.getElementById('avatarCircle');
  const skillsSelect = document.getElementById('skills');
  const commModeSelect = document.getElementById('commMode');
  const learningStyleSelect = document.getElementById('learningStyle');
  const profileCard = document.getElementById('profileCard');
  const inputs = document.querySelectorAll('.profile-input');

  const userGreeting = document.getElementById('userGreeting');
  const userNameEl = document.getElementById('userName');

  let choicesInstance, commModeInstance, learningStyleInstance;

  // Sign Up Form Handling
  if (signUpBtn && signUpModal && signUpClose) {
    signUpBtn.addEventListener('click', () => signUpModal.classList.remove('hidden'));
    signUpClose.addEventListener('click', () => signUpModal.classList.add('hidden'));

    const signUpForm = document.getElementById('signupForm');
    if (signUpForm) {
      console.log('🧠 Binding sign up form...');
      signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/profile.html',
          },
        });

        if (error) return alert('Sign up error: ' + error.message);
        alert('Check your email to confirm the sign-up!');
        signUpModal.classList.add('hidden');
      });
    }
  }

  // Sign In Form Handling
  if (signinBtn && signinModal && signinClose) {
    signinBtn.addEventListener('click', () => signinModal.classList.remove('hidden'));
    signinClose.addEventListener('click', () => signinModal.classList.add('hidden'));

    const signInForm = document.getElementById('signinForm');
    if (signInForm) {
      console.log('🧠 Binding sign in form...');
      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return alert('Sign-in failed: ' + error.message);

        alert('Welcome back!');
        signinModal.classList.add('hidden');
        loadProfile(data.user.id);
      });
    }
  }

  // Initialize Choices.js safely
  if (skillsSelect) {
    choicesInstance = new Choices(skillsSelect, {
      removeItemButton: true,
      placeholderValue: 'Select your skills',
      shouldSort: false,
    });
    choicesInstance.disable();
  }
  if (commModeSelect) {
    commModeInstance = new Choices(commModeSelect, {
      removeItemButton: true,
      placeholderValue: 'Select your preferred communication mode(s)',
      shouldSort: false,
    });
    commModeInstance.disable();
  }
  if (learningStyleSelect) {
    learningStyleInstance = new Choices(learningStyleSelect, {
      placeholderValue: 'Select your learning style as a mentor',
      removeItemButton: true,
      shouldSort: false,
    });
    learningStyleInstance.disable();
  }

  if (nameInput && avatar) {
    nameInput.addEventListener('input', () => {
      const name = nameInput.value.trim();
      avatar.textContent = name ? name.charAt(0).toUpperCase() : 'A';
    });
  }

  function showUserGreeting(name) {
    if (userGreeting && userNameEl) {
      userNameEl.textContent = name || 'User';
      userGreeting.classList.remove('hidden');
    }
  }

  function toggleAuthButtons(loggedIn) {
    const signinEl = document.getElementById('openSignin');
    const signupEl = document.getElementById('openSignup');
    const logoutEl = document.getElementById('logoutBtn');

    if (signinEl) signinEl.classList.toggle('hidden', loggedIn);
    if (signupEl) signupEl.classList.toggle('hidden', loggedIn);
    if (logoutEl) logoutEl.classList.toggle('hidden', !loggedIn);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Failed to log out: ' + error.message);
      } else {
        alert('Logged out successfully.');
        window.location.href = 'index.html';
      }
    });
  }

  if (editBtn && saveBtn && inputs.length > 0) {
    editBtn.addEventListener('click', () => {
      inputs.forEach(input => input.disabled = false);
      choicesInstance?.enable();
      commModeInstance?.enable();
      learningStyleInstance?.enable();
      editBtn.classList.add('hidden');
      saveBtn.classList.remove('hidden');
      profileCard?.classList.add('editing');
    });

    saveBtn.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const profileData = {
        name: nameInput.value,
        designation: designationInput.value,
        description: descriptionInput.value,
        skills: choicesInstance?.getValue(true) || [],
        comm_mode: commModeInstance?.getValue(true) || [],
        learning_style: learningStyleInstance?.getValue(true) || [],
      };

      console.log('🔼 Saving profile data:', profileData);
      const { error } = await supabase.from('profiles').update(profileData).eq('id', user.id);
      alert(error ? 'Failed to save profile: ' + error.message : 'Profile updated!');
      if (!error) {
        inputs.forEach(input => input.disabled = true);
        choicesInstance?.disable();
        commModeInstance?.disable();
        learningStyleInstance?.disable();
        editBtn.classList.remove('hidden');
        saveBtn.classList.add('hidden');
        profileCard?.classList.remove('editing');
      }
    });
  }

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  }

  async function loadProfile(userId, callback) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, designation, description, skills, comm_mode, learning_style')
        .eq('id', userId)
        .single();

      console.log('⬇️ Loaded profile data:', data);

      if (data) {
        nameInput.value = data.name || '';
        designationInput.value = data.designation || '';
        descriptionInput.value = data.description || '';
        avatar.textContent = nameInput.value.charAt(0).toUpperCase();

        choicesInstance?.removeActiveItems();
        choicesInstance?.setChoiceByValue(data.skills || []);

        commModeInstance?.removeActiveItems();
        commModeInstance?.setChoiceByValue(data.comm_mode || []);

        learningStyleInstance?.removeActiveItems();
        learningStyleInstance?.setChoiceByValue(data.learning_style || []);

        if (callback) callback(data.name);
      } else if (error?.code === 'PGRST116') {
        await supabase.from('profiles').insert({
          id: userId,
          name: '',
          designation: '',
          description: '',
          skills: [],
          comm_mode: [],
          learning_style: []
        });
      }
    } catch (err) {
      console.error("loadProfile error:", err);
    }
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      loadProfile(session.user.id, showUserGreeting);
      toggleAuthButtons(true);
    }
  });

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session && sessionData.session.user) {
    loadProfile(sessionData.session.user.id, showUserGreeting);
    toggleAuthButtons(true);
  }
});
