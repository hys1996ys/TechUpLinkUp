const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  const signUpBtn = document.getElementById('openSignup');
  const signUpModal = document.getElementById('signupModal');
  const signUpClose = document.querySelector('.close');

  const signinBtn = document.getElementById('openSignin');
  const signinModal = document.getElementById('signinModal');
  const signinClose = document.querySelector('.close-signin');

  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const nameInput = document.getElementById('name');
  const designationInput = document.getElementById('designation');
  const descriptionInput = document.getElementById('description');
  const avatar = document.getElementById('avatarCircle');
  const skillsSelect = document.getElementById('skills');
  const inputs = document.querySelectorAll('.profile-input');

  let choicesInstance;

  if (skillsSelect) {
    choicesInstance = new Choices(skillsSelect, {
      removeItemButton: true,
      placeholderValue: 'Select your skills',
      shouldSort: false,
    });
    choicesInstance.disable();
  }

  if (nameInput && avatar) {
    nameInput.addEventListener('input', () => {
      const name = nameInput.value.trim();
      avatar.textContent = name ? name.charAt(0).toUpperCase() : 'A';
    });
  }

  if (signUpBtn && signUpModal && signUpClose) {
    signUpBtn.addEventListener('click', () => {
      signUpModal.classList.remove('hidden');
    });

    signUpClose.addEventListener('click', () => {
      signUpModal.classList.add('hidden');
    });

    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const { error } = await supabase.auth.signUp({ email, password });
      alert(error ? 'Error: ' + error.message : 'Sign-up successful! Check email.');
      if (!error) {
  const userId = data.user.id;

  // Insert default profile row
  await supabase.from('profiles').insert({
    id: userId,
    name: '',
    designation: '',
    description: '',
    skills: [],
  });

  alert('Sign-up successful! Check email.');
  signUpModal.classList.add('hidden');
}

    });
  }

  if (signinBtn && signinModal && signinClose) {
    signinBtn.addEventListener('click', () => {
      signinModal.classList.remove('hidden');
    });

    signinClose.addEventListener('click', () => {
      signinModal.classList.add('hidden');
    });

    document.getElementById('signinForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      alert(error ? 'Sign-in failed: ' + error.message : 'Welcome back!');
      if (!error) {
        signinModal.classList.add('hidden');
        const user = data.user;
        if (window.location.pathname.includes('profile.html')) {
          loadProfile(user.id);
        }
      }
    });
  }

  if (editBtn && saveBtn) {
    editBtn.addEventListener('click', () => {
      inputs.forEach(input => input.disabled = false);
      choicesInstance?.enable();
      editBtn.classList.add('hidden');
      saveBtn.classList.remove('hidden');
    });

    saveBtn.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const profileData = {
        name: nameInput.value,
        designation: designationInput.value,
        description: descriptionInput.value,
        skills: choicesInstance?.getValue(true) || [],
      };

      const { error } = await supabase.from('profiles').update(profileData).eq('id', user.id);
      alert(error ? 'Failed to save profile: ' + error.message : 'Profile updated!');
      if (!error) {
        inputs.forEach(input => input.disabled = true);
        choicesInstance?.disable();
        editBtn.classList.remove('hidden');
        saveBtn.classList.add('hidden');
      }
    });
  }

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  }

  async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, designation, description, skills')
    .eq('id', userId)
    .single();

  if (data) {
    nameInput.value = data.name || '';
    designationInput.value = data.designation || '';
    descriptionInput.value = data.description || '';
    avatar.textContent = nameInput.value.charAt(0).toUpperCase();
    if (choicesInstance && data.skills?.length) {
      choicesInstance.removeActiveItems();
      choicesInstance.setChoiceByValue(data.skills);
    }
  } else if (error?.code === 'PGRST116') {
    // No profile yet: Insert a blank one
    await supabase.from('profiles').insert({
      id: userId,
      name: '',
      designation: '',
      description: '',
      skills: [],
    });
    console.warn('Profile did not exist; new one created.');
  } else {
    console.error('Failed to load profile:', error);
  }
}


  const currentUser = await getCurrentUser();
  if (currentUser && window.location.pathname.includes('profile.html')) {
    loadProfile(currentUser.id);
  }
});
