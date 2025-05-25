const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch user session FIRST
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  // Redirect to home if not logged in
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  // Shared Elements
  const signInBtn = document.getElementById('openSignin');
  const signUpBtn = document.getElementById('openSignup');
  const signInModal = document.getElementById('signinModal');
  const signUpModal = document.getElementById('signupModal');
  const closeSignIn = document.querySelector('.close-signin');
  const closeSignUp = document.querySelector('.close');
  const logoutBtn = document.getElementById('logoutBtn');
  const userGreeting = document.getElementById('userGreeting');
  const userNameEl = document.getElementById('userName');

  function showUserGreeting(name) {
    if (userGreeting && userNameEl) {
      userNameEl.textContent = name || 'User';
      userGreeting.classList.remove('hidden');
    }
  }

  function toggleAuthButtons(loggedIn) {
    document.getElementById('openSignin')?.classList.toggle('hidden', loggedIn);
    document.getElementById('openSignup')?.classList.toggle('hidden', loggedIn);
    logoutBtn?.classList.toggle('hidden', !loggedIn);
  }

  if (signInBtn && signInModal) {
    signInBtn.addEventListener('click', () => {
      signInModal.classList.remove('hidden');
    });
  }

  if (signUpBtn && signUpModal) {
    signUpBtn.addEventListener('click', () => {
      signUpModal.classList.remove('hidden');
    });
  }

  if (closeSignIn && signInModal) {
    closeSignIn.addEventListener('click', () => {
      signInModal.classList.add('hidden');
    });
  }

  if (closeSignUp && signUpModal) {
    closeSignUp.addEventListener('click', () => {
      signUpModal.classList.add('hidden');
    });
  }

  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;

      const { error, data } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        alert('Login failed: ' + error.message);
      } else {
        alert('Logged in successfully');
        signInModal.classList.add('hidden');

        const user = data.user;
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();

          showUserGreeting(profileData?.name);
          toggleAuthButtons(true);
        }
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        alert('Sign up failed: ' + error.message);
      } else {
        alert('Account created! Please log in.');
        signUpModal.classList.add('hidden');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      alert('Logged out.');
      location.reload();
    });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    showUserGreeting(profileData?.name);
    toggleAuthButtons(true);
  }

  // === PROFILE PAGE LOGIC ===
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const nameInput = document.getElementById('name');
  const designationInput = document.getElementById('designation');
  const descriptionInput = document.getElementById('description');
  const avatar = document.getElementById('avatarCircle');
  const skillsSelect = document.getElementById('skills');
  const commModeSelect = document.getElementById('commMode');
  const learningStyleSelect = document.getElementById('learningStyle');
  const skillsDisplay = document.getElementById('skillsDisplay');
  const commModeDisplay = document.getElementById('commModeDisplay');
  const learningStyleDisplay = document.getElementById('learningStyleDisplay');
  const profileCard = document.getElementById('profileCard');
  const toggleBtn = document.getElementById('toggleApplications');

  let choicesInstance, commModeInstance, learningStyleInstance;
  let acceptingApplications = false;

  if (skillsSelect && commModeSelect && learningStyleSelect) {
    choicesInstance = new Choices(skillsSelect, {
      removeItemButton: true,
      placeholderValue: 'Select your skills',
      shouldSort: false,
    });

    commModeInstance = new Choices(commModeSelect, {
      removeItemButton: true,
      placeholderValue: 'Select your preferred communication mode(s)',
      shouldSort: false,
    });

    learningStyleInstance = new Choices(learningStyleSelect, {
      removeItemButton: true,
      placeholderValue: 'Select your learning style as a mentor',
      shouldSort: false,
    });

    choicesInstance.disable();
    commModeInstance.disable();
    learningStyleInstance.disable();
  }

  function toggleEditMode(enable) {
    document.querySelectorAll('.profile-input').forEach(input => {
      input.classList.toggle('hidden', !enable);
      input.disabled = !enable;
    });

    document.querySelectorAll('.display-field').forEach(el => {
      el.classList.toggle('hidden', enable);
    });

    if (enable) {
      choicesInstance?.enable();
      commModeInstance?.enable();
      learningStyleInstance?.enable();
      editBtn.classList.add('hidden');
      saveBtn.classList.remove('hidden');
    } else {
      choicesInstance?.disable();
      commModeInstance?.disable();
      learningStyleInstance?.disable();
      editBtn.classList.remove('hidden');
      saveBtn.classList.add('hidden');
    }
  }

  function updateDisplay(data) {
    document.getElementById('nameDisplay').textContent = data.name || '';
    document.getElementById('designationDisplay').textContent = data.designation || '';
    document.getElementById('descriptionDisplay').textContent = data.description || '';
    avatar.textContent = data.name ? data.name.charAt(0).toUpperCase() : 'U';

    skillsDisplay.innerHTML = (data.skills || []).map(skill =>
      `<span class="badge">${skill}</span>`).join('');
    commModeDisplay.innerHTML = (data.comm_mode || []).map(mode =>
      `<span class="badge">${mode}</span>`).join('');
    learningStyleDisplay.innerHTML = (data.learning_style || []).map(style =>
      `<span class="badge">${style}</span>`).join('');
  }

  async function loadProfile(userId, callback) {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, designation, description, skills, comm_mode, learning_style, accepting_applications')
      .eq('id', userId)
      .single();

    if (data) {
      nameInput.value = data.name || '';
      designationInput.value = data.designation || '';
      descriptionInput.value = data.description || '';

      choicesInstance?.removeActiveItems();
      choicesInstance?.setChoiceByValue(data.skills || []);
      commModeInstance?.removeActiveItems();
      commModeInstance?.setChoiceByValue(data.comm_mode || []);
      learningStyleInstance?.removeActiveItems();
      learningStyleInstance?.setChoiceByValue(data.learning_style || []);

      updateDisplay(data);
      if (callback) callback(data.name);

      if (data.accepting_applications) {
        acceptingApplications = true;
        toggleBtn?.classList.add('active');
        toggleBtn.textContent = 'Actively accepting applications';
        document.getElementById('applicationStatus')?.classList.remove('hidden');
      } else {
        acceptingApplications = false;
        toggleBtn?.classList.remove('active');
        toggleBtn.textContent = 'Not accepting applications';
        document.getElementById('applicationStatus')?.classList.add('hidden');
      }

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
  }

  if (editBtn && saveBtn && profileCard) {
    editBtn.addEventListener('click', () => {
      toggleEditMode(true);
      profileCard.classList.add('editing');
    });

    saveBtn.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const profileData = {
        name: nameInput.value,
        designation: designationInput.value,
        description: descriptionInput.value,
        skills: choicesInstance.getValue(true),
        comm_mode: commModeInstance.getValue(true),
        learning_style: learningStyleInstance.getValue(true),
      };

      const { error } = await supabase.from('profiles').update(profileData).eq('id', user.id);

      if (!error) {
        updateDisplay(profileData);
        toggleEditMode(false);
        alert('Profile updated!');
      } else {
        alert('Error saving profile: ' + error.message);
      }

      profileCard.classList.remove('editing');
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', async () => {
      acceptingApplications = !acceptingApplications;

      toggleBtn.classList.toggle('active', acceptingApplications);
      toggleBtn.textContent = acceptingApplications
        ? 'Actively accepting applications'
        : 'Not accepting applications';

      document.getElementById('applicationStatus')?.classList.toggle('hidden', !acceptingApplications);

      const user = await getCurrentUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ accepting_applications: acceptingApplications })
          .eq('id', user.id);

        if (error) {
          alert('Failed to update status: ' + error.message);
        }
      }
    });
  }

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  }

  if (user && document.getElementById('profileCard')) {
    loadProfile(user.id, showUserGreeting);
  }
});
