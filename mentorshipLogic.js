// mentorshipLogic.js

let applicationFilter = 'all'; // global filter state

// Renders a mentor or mentee profile card
function renderCard(profile, score, isPending = false, mentorshipId = null, isMentor = false) {
  // Only show avatar for mentee cards
  const avatar = isMentor ? '' : `<div class="avatar-circle-sm">${profile?.name?.charAt(0)?.toUpperCase() || 'U'}</div>`;
  const skills = (profile.skills || []).map(skill => `<span class="badge">${skill}</span>`).join('');
  const goals = (profile.learning_goals || profile.learning_style || []).map(g => `<span class="badge">${g}</span>`).join('');
  const matchBar = isPending && score !== null && score !== undefined
    ? `<div class="compat-label">${score}% Match</div><div class="compat-bar"><div class="compat-fill" style="width: ${score}%;"></div></div>`
    : '';
  const description = isMentor && profile.description
  ? `<div style="margin-top:0.5rem;"><strong>Description</strong><div style="margin-bottom:0.5rem;"><em>${profile.description}</em></div></div>`
  : '';
  const commModes = isMentor && profile.comm_mode
    ? `<strong>Communication Modes</strong><div class="badge-group">${(Array.isArray(profile.comm_mode) ? profile.comm_mode : [profile.comm_mode]).map(mode => `<span class="badge">${mode}</span>`).join('')}</div>`
    : '';
  const learningStyles = isMentor && profile.learning_style
    ? `<strong>Learning Styles</strong><div class="badge-group">${(Array.isArray(profile.learning_style) ? profile.learning_style : [profile.learning_style]).map(style => `<span class="badge">${style}</span>`).join('')}</div>`
    : '';
  const actionBtn = isPending && mentorshipId
    ? `<button class="btn btn-success full-width" onclick="acceptMentee('${mentorshipId}', this)">Accept</button>
       <button class="btn btn-danger full-width" onclick="rejectMentee('${mentorshipId}', this)">Reject</button>`
    : `<button class="btn btn-success full-width" onclick="scrollToApplication('${profile.application_id || ''}')"><i class="fa fa-eye"></i> View Application</button>`;
  return `
  <div class="mentee-card">
    ${avatar}
    <h3>${profile.name}${profile.designation ? ` <span style="font-weight:400;color:#64748b;font-size:1rem;">(${profile.designation})</span>` : ''}</h3>
    ${description}
    ${matchBar}
    <strong>Learning Goals</strong>
    <div class="badge-group">${goals}</div>
    <strong>Skills</strong>
    <div class="badge-group">${skills}</div>
    ${learningStyles}
    ${commModes}
    ${actionBtn}
  </div>`;
}

// Add/limit cards for mentors/mentees
function renderAddMenteeCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <i class="fa fa-user-plus fa-2x" style="color:#0ea5e9;margin-bottom:1rem;"></i>
      <h3>Add New Mentee</h3>
      <p>Invite someone new to learn under your guidance</p>
      <button class="btn btn-primary full-width" onclick="openMenteeFinder()">Find Mentees</button>
    </div>`;
}
function renderMenteeLimitReachedCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0.6;">
      <i class="fa fa-user-lock fa-2x" style="color:#9ca3af;margin-bottom:1rem;"></i>
      <h3>Mentee Limit Reached</h3>
      <p>You already have 3 active mentees</p>
      <button class="btn full-width" disabled>Limit Reached</button>
    </div>`;
}
function renderAddMentorCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <i class="fa fa-user-plus fa-2x" style="color:#0ea5e9;margin-bottom:1rem;"></i>
      <h3>Find New Mentor</h3>
      <p>Look for a mentor who aligns with your learning goals</p>
      <button class="btn btn-primary full-width" onclick="openMentorFinder()">Submit Request</button>
    </div>`;
}
function renderMentorLimitReachedCard() {
  return `
    <div class="mentee-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;opacity:0.6;">
      <i class="fa fa-user-lock fa-2x" style="color:#9ca3af;margin-bottom:1rem;"></i>
      <h3>Mentor Limit Reached</h3>
      <p>You already have 3 active mentors</p>
      <button class="btn full-width" disabled>Limit Reached</button>
    </div>`;
}

function openMenteeFinder() {
  window.location.href = "discover.html#mentees";
}
function openMentorFinder() {
  document.getElementById('mentorApplicationModal')?.classList.remove('hidden');
}

// Loads and renders: Active & pending mentees (for mentors/ mentees)
async function loadMentorAndMenteeViews() {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Mentor's mentees
  const { data: mentorships } = await supabase
    .from('mentorships')
    .select(`id, mentee_id, status, compatibility_score, mentee:profiles!mentorships_mentee_id_fkey (id, name, designation, skills, learning_goals)`)
    .eq('mentor_id', user.id);

  const pendingMentees = mentorships?.filter(m => m.status === 'pending')?.sort((a, b) => b.compatibility_score - a.compatibility_score) || [];

  
  const activeMentees = mentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
const mentorActiveContainer = document.querySelector('.scroll-container.active');
if (mentorActiveContainer) {
  let html = activeMentees.map(m => renderCard(m.mentee, null, false)).join('');
  if (activeMentees.length < 3) {
    for (let i = 0; i < 3 - activeMentees.length; i++) {
      html += renderAddMenteeCard();
    }
  } else {
    html += renderMenteeLimitReachedCard();
  }
  mentorActiveContainer.innerHTML = html;
}
  document.querySelector('.scroll-container.pending').innerHTML =
    pendingMentees.map(m => renderCard(m.mentee, m.compatibility_score, true, m.id)).join('');

  // Mentee's mentors
  const { data: menteeMentorships } = await supabase
  .from('mentorships')
  .select(`id, mentor_id, application_id, status, compatibility_score, mentor:profiles!mentorships_mentor_id_fkey (id, name, designation, skills, learning_style, comm_mode, description)`)
  .eq('mentee_id', user.id);

  const myPending = menteeMentorships?.filter(m => m.status === 'pending') || [];

 const myMentors = menteeMentorships?.filter(m => m.status === 'active').slice(0, 3) || [];
const menteeActiveContainer = document.querySelector('.scroll-container.mentee-active');
if (menteeActiveContainer) {
  let html = myMentors.map(m => renderCard({ ...m.mentor, application_id: m.application_id }, null, false, m.id, true)).join('');
  if (myMentors.length < 3) {
    // Add the correct number of placeholders
    for (let i = 0; i < 3 - myMentors.length; i++) {
      html += renderAddMentorCard();
    }
  } else {
    html += renderMentorLimitReachedCard();
  }
  menteeActiveContainer.innerHTML = html;
}

  const menteePendingContainer = document.querySelector('.scroll-container.mentee-pending');
  if (menteePendingContainer) {
    menteePendingContainer.innerHTML =
      myPending.map(m => renderCard(m.mentor, m.compatibility_score, true, m.id, true)).join('');
  }
}

// Accept/reject mentee requests (mentor side)
async function acceptMentee(mentorshipId, btn) {
  btn.disabled = true;
  const { error } = await supabase
    .from('mentorships')
    .update({ status: 'active' })
    .eq('id', mentorshipId);

  if (error) {
    alert("Failed to accept mentee.");
    btn.disabled = false;
  } else {
    btn.textContent = 'Accepted';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-secondary');
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }
}

async function rejectMentee(mentorshipId, btn) {
  btn.disabled = true;
  const { error } = await supabase
    .from('mentorships')
    .update({ status: 'rejected' })
    .eq('id', mentorshipId);

  if (error) {
    alert("Failed to reject mentee.");
    btn.disabled = false;
  } else {
    btn.textContent = 'Rejected';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-secondary');
    loadMentorAndMenteeViews();
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
  btnHtml = `
    <button class="btn btn-success" disabled style="margin-bottom:0.5rem;display:block;width:100%;font-size:1.1rem;line-height:1.5;padding:0.2rem 0.6rem;">Request Sent</button>
    <button class="btn" style="background:#e5e7eb;color:#374151;box-shadow:none;padding:0.2rem 0.6rem;font-size:1.1rem;line-height:1.5;display:block;width:100%;margin-top:0.5rem;font-family:inherit;" title="Withdraw" data-mentorship-id="${existing.id}" data-app-id="${app.id}" onclick="handleWithdrawClick(this)">Withdraw</button>
  `;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`;
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}

    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
  btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}

    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    console.log('Mentor:', mentor, 'Existing mentorship:', existing);


    let btnHtml = '';
if (existing && existing.status === 'pending') {
  btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  console.log('loadRecommendationsForApplication called', app, mentorIds);

  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  console.log('Fetched mentors:', mentors);
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);
    
console.log('Filtered mentors:', filteredMentors);
  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
 btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
  btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
 btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Mentor recommendations for a mentee application (separate section)
async function loadRecommendationsForApplication(app, mentorIds = null) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  // Fetch mentors matching the application
  const { data: mentors, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', app.skills)
    .overlaps('learning_style', app.learning_style)
    .overlaps('comm_mode', app.comm_mode);

  // Fetch existing mentorships for this mentee
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id,mentor_id, application_id, status')
    .eq('mentee_id', user.id);

  const container = document.querySelector('.scroll-container.mentor-recommendations');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load recommendations.</div>';
    return;
  }

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<div class="empty">No mentor recommendations found for this application.</div>';
    return;
  }

  // If mentorIds is provided, filter mentors
  let filteredMentors = mentors;
  if (mentorIds && Array.isArray(mentorIds)) {
    filteredMentors = mentors.filter(m => mentorIds.includes(m.id));
  }

  // Use filteredMentors instead of mentors in your rendering loop
  filteredMentors.forEach(mentor => {
    let score = typeof mentor.score === 'number'
      ? mentor.score
      : (typeof computeCompatibility === 'function' ? computeCompatibility(app, mentor) : 0);

    // Check if a mentorship already exists with this mentor
    const existing = myMentorships?.find(
      m => m.mentor_id === mentor.id && m.application_id === app.id
    );

    let btnHtml = '';
if (existing && existing.status === 'pending') {
btnHtml = `
  <button class="btn btn-success" disabled>Request Sent</button>
  <button class="btn"
    data-mentorship-id="${existing.id}"
    data-app-id="${app.id}"
    onclick="handleWithdrawClick(this)">Withdraw</button>
`;
} else if (existing && existing.status === 'active') {
  btnHtml = `<button class="btn btn-secondary" disabled>Mentorship Active</button>`;
} else if (existing && existing.status === 'completed') {
  btnHtml = `<button class="btn btn-secondary" disabled>Completed</button>`; // ✅ Add this line
} else {
  btnHtml = `<button class="btn btn-primary" onclick='requestMentorship("${app.id}", "${mentor.id}", this, ${JSON.stringify(app)})'>Request Mentorship</button>`;
}


    const div = document.createElement('div');
    div.className = 'application-card';
    div.style.position = 'relative';
    // Ensure consistent font family and size
    div.style.fontFamily = 'inherit';
    div.style.fontSize = '1rem';

    div.innerHTML = `
      <strong>Name:</strong>
      <h3 style="font-weight: 400; color: #0f172a; margin: 0; font-family:inherit; font-size:1.1rem;">
        ${mentor.name}
        <span style="font-weight:400; color:#64748b; font-size:1rem; margin-left:0.5rem; font-family:inherit;">
          (${score || 0}% Match)
        </span>
      </h3>
      <strong>Description:</strong>
      <div style="font-family:inherit; font-size:1rem;"><em>${mentor.description || ''}</em></div>
      <strong>Skills:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.skills || []).join(', ')}</div>
      <strong>Learning Styles:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.learning_style || []).join(', ')}</div>
      <strong>Communication Modes:</strong>
      <div style="font-family:inherit; font-size:1rem;">${(mentor.comm_mode || []).join(', ')}</div>
      ${btnHtml}
    `;
    container.appendChild(div);
  });

  // Scroll to mentor recommendations section after rendering
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Request/cancel mentorship (mentee side)
async function requestMentorship(appId, mentorId, btn, app) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  btn.disabled = true;
btn.textContent = 'Sending...';

const { error } = await supabase.from('mentorships').insert({
  mentee_id: user.id,
  mentor_id: mentorId,
  application_id: appId,
  status: 'pending',
  compatibility_score: 0
});

if (error) {
  alert("Failed to send request.");
  console.error(error);
  btn.disabled = false;
  btn.textContent = 'Request Mentorship';
} else {
  // Update the button immediately for instant feedback
  btn.textContent = 'Request Sent';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-success');

  // Wait a bit longer for the DB to update, then reload recommendations
  setTimeout(() => {
    loadRecommendationsForApplication(app);
    loadMentorAndMenteeViews();
     loadMenteeApplications();
  }, 800); // 800ms delay
}

}

async function cancelMentorship(mentorId, btn) {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) return;

  const confirmed = confirm('Are you sure you want to cancel this mentorship request?');
  if (!confirmed) return;

  const { error } = await supabase.from('mentorships')
    .delete()
    .eq('mentee_id', user.id)
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  if (error) {
    alert("Failed to cancel request.");
    console.error(error);
  } else {
    alert("Request canceled.");
    loadMentorAndMenteeViews();
    // Optionally reload recommendations if you want to update that section too
    // loadRecommendationsForApplication(...);
  }
}

// Utility: Compute compatibility score
function computeCompatibility(app, mentor) {
  const overlap = (a, b) => a.filter(x => b.includes(x));
  const s = overlap(app.skills, mentor.skills).length;
  const l = overlap(app.learning_style, mentor.learning_style).length;
  const c = overlap(app.comm_mode, mentor.comm_mode).length;
  return Math.min(100, (s + l + c) * 20);
}

function highlightSelectedApplication(selectedDiv) {
  document.querySelectorAll('.scroll-container.mentee-applications .application-card')
    .forEach(card => card.classList.remove('selected'));
  selectedDiv.classList.add('selected');
}


// Initial load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      applicationFilter = this.getAttribute('data-filter');
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      // Clear mentor recommendations when filter changes
      const recSection = document.querySelector('.scroll-container.mentor-recommendations');
      if (recSection) {
        recSection.classList.add('hidden');
        recSection.style.display = 'none';
        recSection.innerHTML = '';
      }
      loadMenteeApplications();

      // Show mentor recommendations for first active card if filter is active
      if (applicationFilter === 'active') {
  // Wait for DOM update
  setTimeout(() => {
    const firstActive = document.querySelector('.scroll-container.mentee-applications .application-card.active-mentor');
    if (firstActive) {
      firstActive.classList.add('selected');
      // Find the app data for this card
      const appId = firstActive.getAttribute('data-app-id');
      // You need access to the applications and myMentorships arrays here.
      // If you have them globally, use them; otherwise, you may need to refactor.
      const app = window._menteeApplications?.find(a => a.id == appId);
      const mentorship = window._myMentorships?.find(m => m.application_id == appId && m.status === 'active');
      if (app && mentorship) {
        loadRecommendationsForApplication(app, [mentorship.mentor_id]);
        const recSection = document.querySelector('.scroll-container.mentor-recommendations');
        recSection.classList.remove('hidden');
        recSection.style.display = '';
      }
    }
  }, 100); // slight delay to ensure DOM is updated
}
    });
  });
  document.querySelector('.btn-filter[data-filter="all"]')?.classList.add('active');
  loadMenteeApplications();
});

// After fetching applications and mentorships:
async function loadMenteeApplications() {
  const { data: session } = await supabase.auth.getSession();
  const user = session?.session?.user;
  if (!user) {console.log("User not logged in"); return;}  

  const { data: applications, error } = await supabase
    .from('mentor_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const container = document.querySelector('.scroll-container.mentee-applications');
  container.innerHTML = '';

  if (error) {
    container.innerHTML = '<div class="error">Failed to load applications.</div>';
    return;
  }

  if (!applications || applications.length === 0) {
    container.innerHTML = '<div class="empty">No pending applications.</div>';
    return;
  }

  // Fetch mentorships for status checks
  const { data: myMentorships } = await supabase
    .from('mentorships')
    .select('id, mentor_id, application_id, status')
    .eq('mentee_id', user.id);

      window._menteeApplications = applications;
  window._myMentorships = myMentorships;

  // Prepare arrays for each status
  const pending = [];
  const active = [];
  const completed = [];

  applications.forEach(app => {
    // Find mentorships for this application
    const activeMentorship = myMentorships?.find(
      m => m.application_id === app.id && m.status === 'active'
    );

    const completedMentorship = myMentorships?.find(
  m => m.application_id === app.id && (m.status === 'active' || m.status === 'completed' || m.status === 'dissolved')
);

    const hasMentorRequest = myMentorships?.some(
  m => m.application_id === app.id
);

    // Discard button: always disabled for active/completed
    const hasActiveOrCompletedMentorship = myMentorships?.some(
  m => m.application_id === app.id && (m.status === 'active' || m.status === 'completed')
);

const actionBtns = (app.status === 'completed' || hasMentorRequest) ? `
  <div style="position:absolute;top:0.5rem;right:0.5rem;z-index:2;">
    <button class="btn btn-sm btn-danger"
      style="padding:0.2rem 0.6rem;font-size:1.2rem;line-height:1;"
      title="You cannot discard this application"
      disabled
    >&times;</button>
  </div>
` : `
  <div style="position:absolute;top:0.5rem;right:0.5rem;z-index:2;">
    <button class="btn btn-sm btn-danger"
      style="padding:0.2rem 0.6rem;font-size:1.2rem;line-height:1;"
      title="Discard"
      onclick="discardApplication('${app.id}', this)"
    >&times;</button>
  </div>
`;
    const div = document.createElement('div');
    div.className = 'application-card';
    div.setAttribute('data-app-id', app.id);

    // Completed
    if (app.status === 'completed' || completedMentorship?.status === 'completed') {

  div.classList.add('inactive');
  div.style.background = '#f3f4f6';
  div.style.border = '2px solid #d1d5db';
  div.style.opacity = '1';
  div.innerHTML = `
    <div style="position:absolute;top:0.5rem;left:0.5rem;">
      <i class="fa fa-lock" title="This application is completed." style="color:#6b7280;font-size:1.3rem;"></i>
    </div>
    ${actionBtns}
    <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
    <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
    <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
    <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br>
    <small>Status: Completed</small><br>
    <small>Submitted: ${new Date(app.created_at).toLocaleString()}</small>
  `;
  // Allow click to view mentor recommendations for the matched mentor only
  div.addEventListener('click', () => {
    highlightSelectedApplication(div);
    const recSection = document.querySelector('.scroll-container.mentor-recommendations');
    recSection.classList.remove('hidden');
    recSection.style.display = '';
    if (completedMentorship) {
      loadRecommendationsForApplication(app, [completedMentorship.mentor_id]);
    }
  });
  completed.push({ div, created_at: app.created_at });
  return;
}

    // Active
    if (activeMentorship) {
      div.classList.add('active-mentor');
      div.style.background = '#d1fae5';
      div.style.border = '2px solid #10b981';
      div.style.opacity = '1';
      div.innerHTML = `
        <div style="position:absolute;top:0.5rem;left:0.5rem;">
          <i class="fa fa-lock" title="This application is locked because you have an active mentor." style="color:#059669;font-size:1.3rem;"></i>
        </div>
        ${actionBtns}
        <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
        <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
        <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
        <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br>
        <small>Status: Active</small><br>
        <small>Submitted: ${new Date(app.created_at).toLocaleString()}</small>
      `;
      div.addEventListener('click', () => {
        highlightSelectedApplication(div);
        const recSection = document.querySelector('.scroll-container.mentor-recommendations');
        recSection.classList.remove('hidden');
        recSection.style.display = '';
        loadRecommendationsForApplication(app, [activeMentorship.mentor_id]);
      });
      active.push({ div, created_at: app.created_at });
      return;
    }

    // Pending/normal
    div.innerHTML = `
      ${actionBtns}
      <strong>Learning Outcome:</strong> ${app.learning_outcome}<br>
      <strong>Skills:</strong> ${app.skills?.join(', ')}<br>
      <strong>Learning Styles:</strong> ${app.learning_style?.join(', ')}<br>
      <strong>Communication Modes:</strong> ${app.comm_mode?.join(', ')}<br>
      <small>Status: Pending</small><br>
      <small>Submitted: ${new Date(app.created_at).toLocaleString()}</small>
    `;
    div.addEventListener('click', () => {
      highlightSelectedApplication(div);
      const recSection = document.querySelector('.scroll-container.mentor-recommendations');
      recSection.classList.remove('hidden');
      recSection.style.display = '';
      loadRecommendationsForApplication(app);
    });
    pending.push({ div, created_at: app.created_at });
  });

  // Sort each group by most recent first
  const sortByDateDesc = (a, b) => new Date(b.created_at) - new Date(a.created_at);
  pending.sort(sortByDateDesc);
  active.sort(sortByDateDesc);
  completed.sort(sortByDateDesc);

  // Filter and render in one container
  let allGroups = [];
  if (applicationFilter === 'pending') {
    allGroups = pending;
  } else if (applicationFilter === 'active') {
    allGroups = active;
  } else if (applicationFilter === 'completed') {
    allGroups = completed;
  } else {
    allGroups = [...pending, ...active, ...completed];
  }

  container.innerHTML = '';
allGroups.forEach(item => container.appendChild(item.div));
}

// Discard (delete) a pending application
async function discardApplication(appId, btn) {
  const confirmed = confirm('Are you sure you want to discard this application?');
  if (!confirmed) return;
  btn.disabled = true;
  const { error } = await supabase
    .from('mentor_applications')
    .delete()
    .eq('id', appId);
  if (error) {
    alert('Failed to discard application.');
    btn.disabled = false;
  } else {
    alert('Application discarded.');
    loadMenteeApplications();
  }
}

async function dissolveMentor(mentorshipId, btn) {
  const confirmed = confirm('Are you sure you want to dissolve this mentorship?');
  if (!confirmed) return;
  btn.disabled = true;

  // Get the mentorship to find the application_id
  const { data: mentorships, error: fetchError } = await supabase
    .from('mentorships')
    .select('application_id')
    .eq('id', mentorshipId)
    .single();

  if (fetchError) {
    alert('Failed to fetch mentorship.');
    console.error(fetchError);
    btn.disabled = false;
    return;
  }

  // Update mentorship status
  const { error: updateError } = await supabase
    .from('mentorships')
    .update({ status: 'completed' })
    .eq('id', mentorshipId);

  if (updateError) {
    alert('Failed to dissolve mentorship.');
    console.error(updateError);
    btn.disabled = false;
    return;
  }

  // Update the related application status to 'completed'
  if (mentorships?.application_id) {
    await supabase
      .from('mentor_applications')
      .update({ status: 'completed' })
      .eq('id', mentorships.application_id);
  }

  alert('Mentorship dissolved.');
  loadMentorAndMenteeViews();
  loadMenteeApplications();
}

function scrollToApplication(appId) {
  // Scroll the applications section to the top of the viewport
  const appSection = document.querySelector('.scroll-container.mentee-applications');
  if (appSection) {
    window.scrollTo({
      top: appSection.getBoundingClientRect().top + window.scrollY,
      behavior: 'smooth'
    });
  }

  // Highlight the application card and scroll it into view within the section
  const appCard = document.querySelector(`.application-card[data-app-id="${appId}"]`);
  if (appCard) {
    highlightSelectedApplication(appCard);
    // Scroll the card into view within the container (horizontal scroll)
    appCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  } else {
    console.warn('No application card found for appId:', appId);
  }

  // Highlight the application tab/filter (adjust selector as needed)
  document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
  const appTab = document.querySelector('.btn-filter[data-filter="all"]');
  if (appTab) appTab.classList.add('active');
}


function handleWithdrawClick(btn) {
  // Get mentorshipId and appId from button attributes
  const mentorshipId = btn.getAttribute('data-mentorship-id');
  const appId = btn.getAttribute('data-app-id');
  if (!mentorshipId) return;

  const confirmed = confirm('Are you sure you want to withdraw this mentorship request?');
  if (!confirmed) return;

  btn.disabled = true;
  supabase
    .from('mentorships')
    .delete()
    .eq('id', mentorshipId)
    .then(({ error }) => {
      if (error) {
        alert('Failed to withdraw request.');
        btn.disabled = false;
      } else {
        alert('Request withdrawn.');
        // Optionally reload recommendations and applications
        const app = window._menteeApplications?.find(a => a.id == appId);
        if (app) loadRecommendationsForApplication(app);
        loadMentorAndMenteeViews();
        loadMenteeApplications();
      }
    });
}